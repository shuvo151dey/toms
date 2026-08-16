package tech.smdey.toms.component;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.kafka.config.KafkaListenerEndpointRegistry;
import org.springframework.stereotype.Component;

// Pairs with KafkaConfig's kafkaListenerContainerFactory (autoStartup=false):
// ApplicationReadyEvent fires strictly after the embedded server has already
// bound its port, so a slow or failing Kafka connection here can no longer
// delay port binding — it just delays when messages start being consumed.
@Component
public class KafkaListenerStarter {

    @Autowired
    private KafkaListenerEndpointRegistry registry;

    @EventListener(ApplicationReadyEvent.class)
    public void startListeners() {
        registry.start();
    }
}
