package tech.smdey.toms.service;

import java.util.Map;

import org.apache.kafka.clients.producer.ProducerRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import tech.smdey.toms.entity.Trade;
import tech.smdey.toms.entity.TradeOrder;

@Service
public class KafkaProducerService {

    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

    private static final String TRADES_TOPIC = "trades";
    private static final String ORDERS_TOPIC = "orders";
    private static final String PRICES_TOPIC = "market-data";
    private static final String NOTIFICATIONS_TOPIC = "notifications";

    public void sendPriceMessage(String ticker, String tenantId, double price) {
        String message = convertToJson(Map.of("ticker", ticker, "price", price));
        kafkaTemplate.send(
            MessageBuilder
                .withPayload(message)
                .setHeader(KafkaHeaders.TOPIC, PRICES_TOPIC)
                .setHeader("tenantId", tenantId)
                .setHeader("ticker", ticker)
                .build()
        );
    }

    public void sendTradeMessage(Trade trade) {
        String tenantId = trade.getTenantId();
        String message = convertToJson(trade);
        kafkaTemplate.send(
            MessageBuilder
                .withPayload(message)
                .setHeader(KafkaHeaders.TOPIC, TRADES_TOPIC)
                .setHeader("tenantId", tenantId) // Add tenantId as header
                .build()
            );
    }

    public void sendOrderMessage(TradeOrder order) {
        String tenantId = order.getTenantId();
        String message = convertToJson(order);
        kafkaTemplate.send(
                MessageBuilder
                    .withPayload(message)
                    .setHeader(KafkaHeaders.TOPIC, ORDERS_TOPIC)
                    .setHeader("tenantId", tenantId) // Add tenantId as header
                    .build()
                );
    }

    public void sendNotification(String username, String tenantId, String message, String type) {
        ProducerRecord<String, String> record = new ProducerRecord<>(NOTIFICATIONS_TOPIC, tenantId, message);
        record.headers().add("username", username.getBytes());
        record.headers().add("type", type.getBytes());
        record.headers().add("tenantId", tenantId.getBytes());
        kafkaTemplate.send(record);
    }

    private String convertToJson(Object object) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            objectMapper.registerModule(new JavaTimeModule());
            return objectMapper.writeValueAsString(object);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error converting to JSON", e);
        }
    }
}
