package tech.smdey.toms.service;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import tech.smdey.toms.entity.Trade;
import tech.smdey.toms.entity.TradeOrder;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

@Service
public class KafkaConsumerService {

    private final ObjectMapper objectMapper;
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public KafkaConsumerService(SimpMessagingTemplate messagingTemplate) {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.messagingTemplate = messagingTemplate;
    }

    @KafkaListener(topics = "trades", groupId = "toms-group", concurrency = "3")
    public void consumeTrade(ConsumerRecord<String, String> record) {
        String tenantId = extractTenantId(record);
        System.out.println("Received trade for tenant: " + tenantId);

        Trade trade = convertFromJson(record.value(), Trade.class);
        messagingTemplate.convertAndSend("/topic/trades/" + tenantId, trade);
    }

    @KafkaListener(topics = "orders", groupId = "toms-group", concurrency = "3")
    public void consumeOrder(ConsumerRecord<String, String> record) {
        String tenantId = extractTenantId(record);
        System.out.println("Received order for tenant: " + tenantId);

        TradeOrder order = convertFromJson(record.value(), TradeOrder.class);
        messagingTemplate.convertAndSend("/topic/orders/" + tenantId, order);
    }

    private <T> T convertFromJson(String json, Class<T> clazz) {
        try {
            return objectMapper.readValue(json, clazz);
        } catch (Exception e) {
            throw new RuntimeException("Error parsing JSON", e);
        }
    }

    private String extractTenantId(ConsumerRecord<String, String> record) {
        if (record.headers().lastHeader("tenantId") != null) {
            return new String(record.headers().lastHeader("tenantId").value());
        }
        return "default"; // Fallback tenant ID
    }
}
