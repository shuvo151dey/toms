package tech.smdey.toms.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class KafkaProducerService {

    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

    private static final String TRADES_TOPIC = "trades";
    private static final String ORDERS_TOPIC = "orders";

    public void sendTradeMessage(String message) {
        kafkaTemplate.send(TRADES_TOPIC, message);
    }

    public void sendOrderMessage(String message) {
        kafkaTemplate.send(ORDERS_TOPIC, message);
    }
}
