package tech.smdey.toms.service;

import java.util.Comparator;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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

    public void matchOrders(String symbol) {
        List<TradeOrder> buyOrders = orderRepository.findUnmatchedBuyOrders(symbol);
        List<TradeOrder> sellOrders = orderRepository.findUnmatchedSellOrders(symbol);

        // Sort orders based on priority
        buyOrders.sort(Comparator.comparing(TradeOrder::getPrice).reversed()
                .thenComparing(TradeOrder::getTimestamp));
        sellOrders.sort(Comparator.comparing(TradeOrder::getPrice)
                .thenComparing(TradeOrder::getTimestamp));

        // Match buy and sell orders
        for (TradeOrder buy : buyOrders) {
            for (TradeOrder sell : sellOrders) {
                if (buy.getPrice() >= sell.getPrice() && buy.getQuantity() > 0 && sell.getQuantity() > 0) {
                    int tradeQuantity = Math.min(buy.getQuantity(), sell.getQuantity());

                    // Execute trade
                    executeTrade(buy, sell, tradeQuantity);
                }
            }
        }
    }

    private void executeTrade(TradeOrder buy, TradeOrder sell, int quantity) {
        // Reduce quantities
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

        kafkaProducerService.sendTradeMessage(trade);
    }

    private void updateOrderStatus(TradeOrder order) {
        if (order.getQuantity() == 0) {
            order.setStatus(OrderStatus.COMPLETED);
        } else {
            order.setStatus(OrderStatus.PARTIALLY_COMPLETED);
        }
        orderRepository.save(order);

        kafkaProducerService.sendOrderMessage(order);
    }
}
