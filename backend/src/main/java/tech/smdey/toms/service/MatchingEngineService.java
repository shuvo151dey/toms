package tech.smdey.toms.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.PriorityQueue;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import tech.smdey.toms.entity.OrderAction;
import tech.smdey.toms.entity.OrderMethod;
import tech.smdey.toms.entity.OrderStatus;
import tech.smdey.toms.entity.Trade;
import tech.smdey.toms.entity.TradeOrder;
import tech.smdey.toms.repository.OrderRepository;
import tech.smdey.toms.repository.TradeRepository;

@Service
public class MatchingEngineService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private TradeRepository tradeRepository;

    @Autowired
    private KafkaProducerService kafkaProducerService;

    public void matchOrders() {
        List<String> symbols = new ArrayList<String>();
        symbols.add("AAPL");
        symbols.add("GOOGL");
        symbols.add("MSFT");

        for (String symbol : symbols) {
            matchOrdersForSymbol(symbol);
        }

    }

    // Match orders for a specific symbol
    public void matchOrdersForSymbol(String symbol) {
        Pageable topOrders = PageRequest.of(0, 100);
        List<TradeOrder> buyOrders = orderRepository.findUnmatchedBuyOrders(symbol, topOrders);
        List<TradeOrder> sellOrders = orderRepository.findUnmatchedSellOrders(symbol, topOrders);

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
        sellQueue.addAll(sellOrders);
        for (TradeOrder buy : buyOrders) {
            if (buy.getOrderMethod() == OrderMethod.MARKET) {
                while(!sellQueue.isEmpty() && buy.getQuantity() > 0) {
                    TradeOrder sell = sellQueue.poll();
                    int tradeQuantity = Math.min(buy.getQuantity(), sell.getQuantity());
                    executeTrade(buy, sell, tradeQuantity);
                    if (sell.getQuantity() > 0) {
                        sellQueue.add(sell);
                    }
                }
            }
        }
        PriorityQueue<TradeOrder> buyQueue = new PriorityQueue<>(Comparator.comparing(TradeOrder::getTimestamp));
        buyQueue.addAll(buyOrders);

        for (TradeOrder sell : sellOrders) {
            if (sell.getOrderMethod() == OrderMethod.MARKET) {
                while(!buyQueue.isEmpty() && sell.getQuantity() > 0) {
                    TradeOrder buy = buyQueue.poll();
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
        PriorityQueue<TradeOrder> sellQueue = new PriorityQueue<>(Comparator.comparing(TradeOrder::getPrice).reversed()
                .thenComparing(TradeOrder::getTimestamp));
        sellQueue.addAll(sellOrders);

        for (TradeOrder buy : buyOrders) {
            if (buy.getOrderMethod() == OrderMethod.LIMIT) {
                while(!sellQueue.isEmpty() && buy.getPrice() >= sellQueue.peek().getPrice() && buy.getQuantity() > 0) {
                    TradeOrder sell = sellQueue.poll();
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
        if(!buy.getTenantId().equals(sell.getTenantId())) {
            return;
        }
        // Update order quantities
        buy.setQuantity(buy.getQuantity() - quantity);
        sell.setQuantity(sell.getQuantity() - quantity);

        // Update order statuses
        updateOrderStatus(buy);
        updateOrderStatus(sell);

        // Record the trade
        Trade trade = new Trade();
        trade.setBuyOrder(buy);
        trade.setSellOrder(sell);
        trade.setQuantity(quantity);
        trade.setSymbol(buy.getSymbol());
        trade.setPrice(sell.getPrice());
        trade.setTenantId(buy.getTenantId());
        tradeRepository.save(trade);

        // Notify via Kafka
        kafkaProducerService.sendTradeMessage(trade);
    }

    // Update order status
    private void updateOrderStatus(TradeOrder order) {
        if (order.getQuantity() == 0) {
            order.setStatus(OrderStatus.COMPLETED);
        } else {
            order.setStatus(OrderStatus.PARTIALLY_COMPLETED);
        }
        orderRepository.save(order);

        // Notify via Kafka
        kafkaProducerService.sendOrderMessage(order);
    }

    // Trigger stop orders based on market price
    public void triggerStopOrders(String symbol, double marketPrice) {
        List<TradeOrder> stopOrders = orderRepository.findStopOrders(symbol);
        for (TradeOrder stopOrder : stopOrders) {
            boolean shouldTrigger = (stopOrder.getOrderAction() == OrderAction.BUY && marketPrice >= stopOrder.getStopPrice()) ||
                                    (stopOrder.getOrderAction() == OrderAction.SELL && marketPrice <= stopOrder.getStopPrice());

            if (shouldTrigger) {
                stopOrder.setOrderMethod(OrderMethod.MARKET);
                orderRepository.save(stopOrder);
                matchOrdersForSymbol(stopOrder.getSymbol()); // Reprocess the market orders
            }
        }
    }
}
