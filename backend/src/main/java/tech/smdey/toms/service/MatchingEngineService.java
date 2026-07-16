package tech.smdey.toms.service;

import java.util.Comparator;
import java.util.List;
import java.util.PriorityQueue;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import tech.smdey.toms.entity.OrderAction;
import tech.smdey.toms.entity.OrderMethod;
import tech.smdey.toms.entity.TradeOrder;
import tech.smdey.toms.repository.OrderRepository;
import tech.smdey.toms.repository.SymbolRepository;

@Service
public class MatchingEngineService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private KafkaProducerService kafkaProducerService;

    @Autowired
    private SymbolRepository symbolRepository;

    @Autowired
    private TradeExecutorService tradeExecutorService;

    public void matchOrders(String tenantId) {
        symbolRepository.findAll().forEach(s -> matchOrdersForSymbol(s.getTicker(), tenantId));
    }

    @Async
    public void asyncMatchOrdersForSymbol(String symbol, String tenantId) {
        matchOrdersForSymbol(symbol, tenantId);
    }

    // Match orders for a specific symbol
    public void matchOrdersForSymbol(String symbol, String tenantId) {
        Pageable topOrders = PageRequest.of(0, 100);
        List<TradeOrder> buyOrders = orderRepository.findUnmatchedBuyOrders(symbol, tenantId, topOrders);
        List<TradeOrder> sellOrders = orderRepository.findUnmatchedSellOrders(symbol, tenantId, topOrders);

        // Sort orders
        buyOrders.sort(Comparator.comparing(TradeOrder::getPrice).reversed()
                .thenComparing(TradeOrder::getTimestamp));
        sellOrders.sort(Comparator.comparing(TradeOrder::getPrice)
                .thenComparing(TradeOrder::getTimestamp));

        // Process orders based on type
        processMarketOrders(buyOrders, sellOrders);
        processLimitOrders(buyOrders, sellOrders);
    }

    // Process MARKET orders
    private void processMarketOrders(List<TradeOrder> buyOrders, List<TradeOrder> sellOrders) {
        PriorityQueue<TradeOrder> sellQueue = new PriorityQueue<>(Comparator.comparing(TradeOrder::getTimestamp));
        sellOrders.stream().filter(o -> o.getQuantity() > 0).forEach(sellQueue::add);
        for (TradeOrder buy : buyOrders) {
            if (buy.getOrderMethod() == OrderMethod.MARKET) {
                while(!sellQueue.isEmpty() && buy.getQuantity() > 0) {
                    TradeOrder sell = sellQueue.poll();
                    if (sell.getQuantity() <= 0) continue;
                    int tradeQuantity = Math.min(buy.getQuantity(), sell.getQuantity());
                    executeTrade(buy, sell, tradeQuantity);
                    if (sell.getQuantity() > 0) {
                        sellQueue.add(sell);
                    }
                }
            }
        }
        PriorityQueue<TradeOrder> buyQueue = new PriorityQueue<>(Comparator.comparing(TradeOrder::getTimestamp));
        buyOrders.stream().filter(o -> o.getQuantity() > 0).forEach(buyQueue::add);

        for (TradeOrder sell : sellOrders) {
            if (sell.getOrderMethod() == OrderMethod.MARKET) {
                while(!buyQueue.isEmpty() && sell.getQuantity() > 0) {
                    TradeOrder buy = buyQueue.poll();
                    if (buy.getQuantity() <= 0) continue;
                    int tradeQuantity = Math.min(buy.getQuantity(), sell.getQuantity());
                    executeTrade(buy, sell, tradeQuantity);
                    if (buy.getQuantity() > 0) {
                        buyQueue.add(buy);
                    }
                }
            }
        }
    }

    // Process LIMIT orders
    private void processLimitOrders(List<TradeOrder> buyOrders, List<TradeOrder> sellOrders) {
        // Best ask first: lowest price, then earliest timestamp (price-time priority)
        PriorityQueue<TradeOrder> sellQueue = new PriorityQueue<>(Comparator.comparing(TradeOrder::getPrice)
                .thenComparing(TradeOrder::getTimestamp));
        sellOrders.stream().filter(o -> o.getQuantity() > 0).forEach(sellQueue::add);

        for (TradeOrder buy : buyOrders) {
            if (buy.getOrderMethod() == OrderMethod.LIMIT) {
                while(!sellQueue.isEmpty() && buy.getPrice() >= sellQueue.peek().getPrice() && buy.getQuantity() > 0) {
                    TradeOrder sell = sellQueue.poll();
                    if (sell.getQuantity() <= 0) continue;
                    int tradeQuantity = Math.min(buy.getQuantity(), sell.getQuantity());
                    executeTrade(buy, sell, tradeQuantity);
                    if (sell.getQuantity() > 0) {
                        sellQueue.add(sell);
                    }
                }
            }
        }
    }

    


    // Execute trade between two orders
    private void executeTrade(TradeOrder buy, TradeOrder sell, int quantity) {
        tradeExecutorService.executeTrade(buy, sell, quantity);
    }

    

    // Trigger stop orders based on market price
    public void triggerStopOrders(String symbol, double marketPrice, String tenantId) {
        List<TradeOrder> stopOrders = orderRepository.findStopOrders(symbol, tenantId);
        for (TradeOrder stopOrder : stopOrders) {
            boolean shouldTrigger = (stopOrder.getOrderAction() == OrderAction.BUY && marketPrice >= stopOrder.getStopPrice()) ||
                                    (stopOrder.getOrderAction() == OrderAction.SELL && marketPrice <= stopOrder.getStopPrice());

            if (shouldTrigger) {
                stopOrder.setOrderMethod(OrderMethod.MARKET);
                orderRepository.save(stopOrder);
                matchOrdersForSymbol(stopOrder.getSymbol(), tenantId); // Reprocess the market orders
                kafkaProducerService.sendNotification(stopOrder.getUsername(), stopOrder.getTenantId(), "Stop order triggered: " + stopOrder.getQuantity() + " shares of " + stopOrder.getSymbol() + " at $" + stopOrder.getStopPrice(), "STOP_TRIGGERED");
            }
        }
    }
}
