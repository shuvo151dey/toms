package tech.smdey.toms.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import tech.smdey.toms.entity.OrderStatus;
import tech.smdey.toms.entity.Trade;
import tech.smdey.toms.entity.TradeOrder;
import tech.smdey.toms.repository.OrderRepository;
import tech.smdey.toms.repository.TradeRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class TradeService {

    @Autowired
    private TradeRepository tradeRepository;

    @Autowired
    private OrderRepository orderRepository;

    public Trade createTrade(Trade trade) {
        Long orderId = trade.getTradeOrder().getId();
        Optional<TradeOrder> orderOptional = orderRepository.findById(orderId);

        if (orderOptional.isEmpty()) {
            throw new IllegalArgumentException("Order with ID " + orderId + " not found");
        }

        TradeOrder order = orderOptional.get();

        // Validate order status
        if (order.getStatus() == OrderStatus.COMPLETED || order.getStatus() == OrderStatus.CANCELED) {
            throw new IllegalStateException("Cannot create trade for order with status: " + order.getStatus());
        }

        // Validate trade quantity
        if (trade.getQuantity() > order.getQuantity()) {
            throw new IllegalArgumentException("Trade quantity exceeds order quantity");
        }

        // Save trade
        trade.setSymbol(order.getSymbol());
        trade.setExecutedAt(LocalDateTime.now());
        Trade savedTrade = tradeRepository.save(trade);

        // Update order quantity and status
        int remainingQuantity = order.getQuantity() - trade.getQuantity();
        if (remainingQuantity == 0) {
            order.setStatus(OrderStatus.COMPLETED);
        } else {
            order.setStatus(OrderStatus.PARTIALLY_COMPLETED);
        }
        order.setQuantity(remainingQuantity);
        orderRepository.save(order);

        return savedTrade;
    }

    public List<Trade> getAllTrades() {
        return tradeRepository.findAll();
    }
}
