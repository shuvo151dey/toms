package tech.smdey.toms.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import tech.smdey.toms.entity.OrderStatus;
import tech.smdey.toms.entity.Trade;
import tech.smdey.toms.entity.TradeOrder;
import tech.smdey.toms.repository.OrderRepository;
import tech.smdey.toms.repository.TradeRepository;

@Service
public class AnalyticsService {

    @Autowired
    private TradeRepository tradeRepository;

    @Autowired
    private OrderRepository orderRepository;

    public Map<String, Object> getTradeAnalytics(String symbol, LocalDateTime from, LocalDateTime to) {
        List<Trade> trades = tradeRepository.findTrades(symbol, from, to);

        double totalVolume = trades.stream().mapToDouble(Trade::getQuantity).sum();
        double vwap = trades.stream()
                .mapToDouble(trade -> trade.getPrice() * trade.getQuantity())
                .sum() / totalVolume;

        Map<String, Object> result = new HashMap<>();
        result.put("totalVolume", totalVolume);
        result.put("vwap", vwap);
        result.put("totalTrades", trades.size());
        return result;
    }

    public Map<String, Object> getOrderAnalytics(String symbol) {
        List<TradeOrder> orders = orderRepository.findOrdersBySymbol(symbol);

        long totalOrders = orders.size();
        long completedOrders = orders.stream()
                .filter(order -> order.getStatus() == OrderStatus.COMPLETED)
                .count();
        long canceledOrders = orders.stream()
                .filter(order -> order.getStatus() == OrderStatus.CANCELED)
                .count();

        Map<String, Object> result = new HashMap<>();
        result.put("totalOrders", totalOrders);
        result.put("completedOrders", completedOrders);
        result.put("canceledOrders", canceledOrders);
        result.put("fillRate", (double) completedOrders / totalOrders * 100);
        return result;
    }

}
