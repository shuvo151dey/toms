package tech.smdey.toms.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class KafkaConsumerService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @KafkaListener(topics = "trades", groupId = "toms-group")
    public void consumeTradeMessage(String message) {
        System.out.println("Received Trade Message: " + message);
        messagingTemplate.convertAndSend("/topic/trades", message);
    }

    @KafkaListener(topics = "orders", groupId = "toms-group")
    public void consumeOrderMessage(String message) {
        System.out.println("Received Order Message: " + message);
        messagingTemplate.convertAndSend("/topic/orders", message);
    }
}
