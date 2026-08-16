package tech.smdey.toms.config;

import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.CommonClientConfigs;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.config.SaslConfigs;
import org.apache.kafka.common.config.SslConfigs;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.*;
import org.springframework.kafka.config.TopicBuilder;

import io.micrometer.observation.ObservationRegistry;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableKafka
public class KafkaConfig {

    // Producer/consumer factories below are hand-built (not Boot's KafkaAutoConfiguration),
    // so spring.kafka.template.observation-enabled / listener.observation-enabled have no
    // effect here — Boot only wires those into beans IT creates. Enable + wire tracing
    // manually on the KafkaTemplate and listener container factory instead.
    @Autowired
    private ObservationRegistry observationRegistry;

    @Value("${kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Value("${kafka.security.protocol}")
    private String securityProtocol;

    @Value("${kafka.sasl.mechanism}")
    private String saslMechanism;

    @Value("${kafka.sasl.username}")
    private String saslUsername;

    @Value("${kafka.sasl.password}")
    private String saslPassword;

    // Managed providers (Aiven, Confluent Cloud, etc.) commonly sign their broker
    // certs with a private CA rather than a public one, so the JVM's default
    // trust store won't validate the TLS handshake — this must be supplied
    // explicitly. Left blank, no custom truststore is configured (matches prior
    // behavior for brokers with publicly-trusted certs, e.g. local SASL_PLAINTEXT).
    // Base64-encoded so a multi-line PEM survives being pasted into a single-line
    // env var field without newline-mangling risk.
    @Value("${kafka.ssl.ca-cert-base64:}")
    private String sslCaCertBase64;

    @Bean
    public ProducerFactory<String, String> producerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.putAll(securityProps());
        return new DefaultKafkaProducerFactory<>(configProps);
    }

    @Bean
    public KafkaTemplate<String, String> kafkaTemplate() {
        KafkaTemplate<String, String> template = new KafkaTemplate<>(producerFactory());
        template.setObservationEnabled(true);
        template.setObservationRegistry(observationRegistry);
        return template;
    }

    @Bean
    public ConsumerFactory<String, String> consumerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        configProps.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        configProps.put(ConsumerConfig.GROUP_ID_CONFIG, "toms-group");
        configProps.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        configProps.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        configProps.putAll(securityProps());
        return new DefaultKafkaConsumerFactory<>(configProps);
    }

    // Boot autoconfigures its own KafkaAdmin from the spring.kafka.* namespace
    // regardless of the beans above — defining our own here makes that back off
    // (@ConditionalOnMissingBean, same as the other Kafka beans), so there's a
    // single source of truth for security config instead of a second copy that
    // can silently drift out of sync (e.g. a hardcoded PlainLoginModule string
    // left behind after switching to SCRAM — exactly what happened here).
    @Bean
    public KafkaAdmin kafkaAdmin() {
        Map<String, Object> configProps = new HashMap<>();
        configProps.put(CommonClientConfigs.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        configProps.putAll(securityProps());
        return new KafkaAdmin(configProps);
    }

    // KafkaAdmin auto-creates any NewTopic beans it finds on startup. Local dev
    // brokers usually have auto.create.topics.enable=true so this is a no-op
    // there, but managed providers (Aiven included) don't auto-create topics —
    // without these, every producer/consumer fails with UNKNOWN_TOPIC_OR_PARTITION.
    // 3 partitions matches the concurrency="3" on every @KafkaListener in
    // KafkaConsumerService, so each consumer thread gets its own partition.
    // replicas=1 is deliberately conservative — safe on any cluster size.
    @Bean
    public NewTopic ordersTopic() {
        return TopicBuilder.name("orders").partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic tradesTopic() {
        return TopicBuilder.name("trades").partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic notificationsTopic() {
        return TopicBuilder.name("notifications").partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic marketDataTopic() {
        return TopicBuilder.name("market-data").partitions(3).replicas(1).build();
    }

    // Listener containers normally start synchronously during context refresh —
    // if the broker connection/auth is slow or failing, that blocks the rest of
    // startup, including Tomcat (which only opens its port as the very last step).
    // autoStartup=false here + KafkaListenerStarter (starts them on
    // ApplicationReadyEvent, which fires strictly after the port is already
    // bound) decouples Kafka connectivity from how fast the app can bind its port.
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, String> kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, String> factory = new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        factory.setAutoStartup(false);
        factory.getContainerProperties().setObservationEnabled(true);
        factory.getContainerProperties().setObservationRegistry(observationRegistry);
        return factory;
    }

    private Map<String, Object> securityProps() {
        Map<String, Object> props = new HashMap<>();
        props.put(CommonClientConfigs.SECURITY_PROTOCOL_CONFIG, securityProtocol);
        if (!securityProtocol.equals("PLAINTEXT")) {
            props.put(SaslConfigs.SASL_MECHANISM, saslMechanism);
            props.put(SaslConfigs.SASL_JAAS_CONFIG, buildJaasConfig());
        }
        if (!sslCaCertBase64.isBlank()) {
            // MIME decoder, not the strict basic one — tolerates any stray
            // whitespace/newlines introduced by copy-paste through a dashboard
            // UI, which the basic decoder rejects outright.
            String pem = new String(Base64.getMimeDecoder().decode(sslCaCertBase64), StandardCharsets.UTF_8);
            props.put(SslConfigs.SSL_TRUSTSTORE_TYPE_CONFIG, "PEM");
            props.put(SslConfigs.SSL_TRUSTSTORE_CERTIFICATES_CONFIG, pem);
        }
        return props;
    }

    // The JAAS login module class must match the configured SASL mechanism —
    // PLAIN uses PlainLoginModule, but managed Kafka providers (e.g. Aiven,
    // Confluent Cloud) commonly issue SCRAM-SHA-256/512 credentials instead,
    // which require ScramLoginModule. Using the wrong module fails auth at
    // runtime even when the mechanism string itself is set correctly.
    private String buildJaasConfig() {
        String loginModule = switch (saslMechanism) {
            case "SCRAM-SHA-256", "SCRAM-SHA-512" -> "org.apache.kafka.common.security.scram.ScramLoginModule";
            default -> "org.apache.kafka.common.security.plain.PlainLoginModule";
        };
        return loginModule + " required username=\"" + saslUsername + "\" password=\"" + saslPassword + "\";";
    }
}
