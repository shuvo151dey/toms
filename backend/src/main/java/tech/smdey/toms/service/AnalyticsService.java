package tech.smdey.toms.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
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

    public Map<String, Object> getPnl(String username, String tenantId) {
        List<Trade> buyTrades = tradeRepository.findBuyTradesByUsername(username, tenantId);
        List<Trade> sellTrades = tradeRepository.findSellTradesByUsername(username, tenantId);

        // Overall totals
        double totalBuyAmount = buyTrades.stream().mapToDouble(t -> t.getPrice() * t.getQuantity()).sum();
        double totalSellAmount = sellTrades.stream().mapToDouble(t -> t.getPrice() * t.getQuantity()).sum();

        // Symbol-wise: aggregate buy and sell amounts per symbol, then compute pnl
        Map<String, Double> buyBySymbol = buyTrades.stream().collect(
            Collectors.groupingBy(Trade::getSymbol,
                Collectors.summingDouble(t -> t.getPrice() * t.getQuantity())));
        Map<String, Double> sellBySymbol = sellTrades.stream().collect(
            Collectors.groupingBy(Trade::getSymbol,
                Collectors.summingDouble(t -> t.getPrice() * t.getQuantity())));

        Set<String> allSymbols = new HashSet<>();
        allSymbols.addAll(buyBySymbol.keySet());
        allSymbols.addAll(sellBySymbol.keySet());

        Map<String, Double> pnlBySymbol = allSymbols.stream().collect(
            Collectors.toMap(
                symbol -> symbol,
                symbol -> sellBySymbol.getOrDefault(symbol, 0.0) - buyBySymbol.getOrDefault(symbol, 0.0)
            ));

        Map<String, Object> result = new HashMap<>();
        result.put("totalBuyAmount", totalBuyAmount);
        result.put("totalSellAmount", totalSellAmount);
        result.put("pnl", totalSellAmount - totalBuyAmount);
        result.put("pnlBySymbol", pnlBySymbol);
        return result;
    }

    @Cacheable(value = "tradeAnalytics", key = "#symbol + '_' + #tenantId")
    public Map<String, Object> getTradeAnalytics(String symbol, String tenantId, LocalDateTime from, LocalDateTime to) {
        List<Trade> trades = tradeRepository.findTrades(symbol, tenantId, from, to);
    
        if (trades.isEmpty()) {
            // Handle case where no trades are found
            Map<String, Object> emptyResult = new HashMap<>();
            emptyResult.put("totalVolume", 0.0);
            emptyResult.put("vwap", 0.0);
            emptyResult.put("totalTrades", 0);
            return emptyResult;
        }
    
        double totalVolume = trades.stream().mapToDouble(Trade::getQuantity).sum();
        double totalWeightedPrice = trades.stream()
                .mapToDouble(trade -> trade.getPrice() * trade.getQuantity())
                .sum();
        double vwap = totalWeightedPrice / totalVolume;
    
        Map<String, Object> result = new HashMap<>();
        result.put("totalVolume", totalVolume);
        result.put("vwap", vwap);
        result.put("totalTrades", trades.size());
        return result;
    }
    
    @Cacheable(value = "orderAnalytics", key = "#symbol + '_' + #tenantId")
    public Map<String, Object> getOrderAnalytics(String symbol, String tenantId) {
        List<TradeOrder> orders = orderRepository.findOrdersBySymbol(symbol, tenantId);
    
        long totalOrders = orders.size();
        if (totalOrders == 0) {
            // Handle case where no orders are found
            Map<String, Object> emptyResult = new HashMap<>();
            emptyResult.put("totalOrders", 0L);
            emptyResult.put("completedOrders", 0L);
            emptyResult.put("canceledOrders", 0L);
            emptyResult.put("fillRate", 0.0);
            return emptyResult;
        }
    
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

    public Map<String, Object> getVolatilityMetrics(String symbol, String tenantId) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        List<Trade> trades = tradeRepository.findTrades(symbol, tenantId, startOfDay, LocalDateTime.now());

        Map<String, Object> result = new HashMap<>();
        if (trades.isEmpty()) {
            result.put("high", 0.0);
            result.put("low", 0.0);
            result.put("open", 0.0);
            result.put("close", 0.0);
            result.put("spread", 0.0);
            result.put("volatility", 0.0);
            return result;
        }

        List<Trade> sorted = trades.stream()
            .sorted(Comparator.comparing(Trade::getTradeTimestamp))
            .collect(Collectors.toList());

        double high = sorted.stream().mapToDouble(Trade::getPrice).max().orElse(0.0);
        double low = sorted.stream().mapToDouble(Trade::getPrice).min().orElse(0.0);
        double open = sorted.get(0).getPrice();
        double close = sorted.get(sorted.size() - 1).getPrice();
        double spread = high - low;

        double mean = sorted.stream().mapToDouble(Trade::getPrice).average().orElse(0.0);
        double variance = sorted.stream().mapToDouble(t -> Math.pow(t.getPrice() - mean, 2)).average().orElse(0.0);
        double volatility = Math.sqrt(variance);

        result.put("high", high);
        result.put("low", low);
        result.put("open", open);
        result.put("close", close);
        result.put("spread", spread);
        result.put("volatility", volatility);
        return result;
    }

}
