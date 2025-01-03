package tech.smdey.toms.service;

import org.springframework.stereotype.Service;

import tech.smdey.toms.entity.TradeOrder;

import java.util.Arrays;
import java.util.List;

@Service
public class OrderService {

    private static final List<String> ALLOWED_SYMBOLS = Arrays.asList("AAPL", "GOOGL", "MSFT");

    public boolean validateOrder(TradeOrder order) {
        if (!ALLOWED_SYMBOLS.contains(order.getSymbol())) {
            throw new IllegalArgumentException("Symbol " + order.getSymbol() + " is not allowed");
        }

        if (order.getQuantity() > 100) {
            throw new IllegalArgumentException("Quantity " + order.getQuantity() + " exceeds the limit");
        }

        return true;
    }
}
