package tech.smdey.toms.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
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

    public void sendTradeMessage(Trade trade) {
        String message = convertToJson(trade);
        kafkaTemplate.send(TRADES_TOPIC, message);
    }

    public void sendOrderMessage(TradeOrder order) {
        String message = convertToJson(order);
        kafkaTemplate.send(ORDERS_TOPIC, message);
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
