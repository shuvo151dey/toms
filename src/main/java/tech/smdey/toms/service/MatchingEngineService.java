package tech.smdey.toms.service;

import java.util.Comparator;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
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

    // Match orders for a specific symbol
    public void matchOrders(String symbol) {
        List<TradeOrder> buyOrders = orderRepository.findUnmatchedBuyOrders(symbol);
        List<TradeOrder> sellOrders = orderRepository.findUnmatchedSellOrders(symbol);

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
        for (TradeOrder buy : buyOrders) {
            if (buy.getOrderMethod() == OrderMethod.MARKET) {
                for (TradeOrder sell : sellOrders) {
                    if (sell.getQuantity() > 0) {
                        int tradeQuantity = Math.min(buy.getQuantity(), sell.getQuantity());
                        executeTrade(buy, sell, tradeQuantity);
                    }
                }
            }
        }

        for (TradeOrder sell : sellOrders) {
            if (sell.getOrderMethod() == OrderMethod.MARKET) {
                for (TradeOrder buy : buyOrders) {
                    if (buy.getQuantity() > 0) {
                        int tradeQuantity = Math.min(buy.getQuantity(), sell.getQuantity());
                        executeTrade(buy, sell, tradeQuantity);
                    }
                }
            }
        }
    }

    // Process LIMIT orders
    private void processLimitOrders(List<TradeOrder> buyOrders, List<TradeOrder> sellOrders) {
        for (TradeOrder buy : buyOrders) {
            if (buy.getOrderMethod() == OrderMethod.LIMIT) {
                for (TradeOrder sell : sellOrders) {
                    if (sell.getOrderMethod() == OrderMethod.LIMIT &&
                        buy.getPrice() >= sell.getPrice() &&
                        buy.getQuantity() > 0 &&
                        sell.getQuantity() > 0) {
                        int tradeQuantity = Math.min(buy.getQuantity(), sell.getQuantity());
                        executeTrade(buy, sell, tradeQuantity);
                    }
                }
            }
        }
    }

    // Execute trade between two orders
    private void executeTrade(TradeOrder buy, TradeOrder sell, int quantity) {
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
                matchOrders(stopOrder.getSymbol()); // Reprocess the market orders
            }
        }
    }
}
