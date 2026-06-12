package tech.smdey.toms.service;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Map;
import tech.smdey.toms.entity.Trade;
import tech.smdey.toms.entity.TradeOrder;
import tech.smdey.toms.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
@Service
public class KafkaConsumerService {

    private final ObjectMapper objectMapper;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Autowired
    public KafkaConsumerService(SimpMessagingTemplate messagingTemplate, NotificationService notificationService, UserRepository userRepository, EmailService emailService) {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.messagingTemplate = messagingTemplate;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    @KafkaListener(topics = "market-data", groupId = "toms-group", concurrency = "3")
    public void consumePrice(ConsumerRecord<String, String> record) {
        String tenantId = extractTenantId(record);
        String ticker = new String(record.headers().lastHeader("ticker").value());
        Map<String, Object> priceUpdate = convertFromJson(record.value(), Map.class);
        messagingTemplate.convertAndSend("/topic/prices/" + tenantId + "/" + ticker, priceUpdate);
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

    @KafkaListener(topics = "notifications", groupId = "toms-group", concurrency = "3")
    public void consumeNotification(ConsumerRecord<String, String> record) {
        String username = new String(record.headers().lastHeader("username").value());
        String tenantId = new String(record.headers().lastHeader("tenantId").value());
        String type = new String(record.headers().lastHeader("type").value());
        String message = record.value();

        notificationService.notify(username, tenantId, type, message);
        userRepository.findByUsername(username).ifPresent(user -> {
            if (user.getEmail() != null) {
                String template = switch (type) {
                    case "ORDER_FILLED" -> "order-filled";
                    case "ORDER_REJECTED" -> "order-rejected";
                    case "STOP_TRIGGERED" -> "stop-triggered";
                    default -> null;
                };
                if (template != null) {
                    emailService.sendHtmlEmail(user.getEmail(), "TOMS - " + type.replace("_", " "), template, Map.of("message", message));
                }
            }
        });
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
