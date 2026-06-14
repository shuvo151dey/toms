package tech.smdey.toms.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import tech.smdey.toms.entity.OrderStatus;
import tech.smdey.toms.entity.Position;
import tech.smdey.toms.entity.Trade;
import tech.smdey.toms.entity.TradeOrder;
import tech.smdey.toms.repository.OrderRepository;
import tech.smdey.toms.repository.PositionRepository;
import tech.smdey.toms.repository.TradeRepository;

@Service
public class TradeExecutorService {
    @Autowired private OrderRepository orderRepository;
    @Autowired private TradeRepository tradeRepository;
    @Autowired private PositionRepository positionRepository;
    @Autowired private KafkaProducerService kafkaProducerService;

    @Transactional(isolation = Isolation.REPEATABLE_READ)
    public void executeTrade(TradeOrder buy, TradeOrder sell, int quantity) {
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

        updatePositions(buy, sell, quantity, sell.getPrice());

        // Notify via Kafka
        kafkaProducerService.sendTradeMessage(trade);
        kafkaProducerService.sendNotification(buy.getUsername(), buy.getTenantId(), "Order filled: " + quantity + " shares of " + sell.getSymbol() + " at $" + sell.getPrice(), "ORDER_FILLED");
        kafkaProducerService.sendNotification(sell.getUsername(), sell.getTenantId(), "Order filled: " + quantity + " shares of " + sell.getSymbol() + " at $" + sell.getPrice(), "ORDER_FILLED");
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

    private void updatePositions(TradeOrder buy, TradeOrder sell, int quantity, double tradePrice) {
        updatePosition(buy.getUsername(), buy.getSymbol(), buy.getTenantId(), quantity, tradePrice, true);
        updatePosition(sell.getUsername(), sell.getSymbol(), sell.getTenantId(), quantity, tradePrice, false);
    }

    private void updatePosition(String username, String symbol, String tenantId,
                                int quantity, double tradePrice, boolean isBuy) {
        Position position = positionRepository
            .findByUsernameAndSymbolAndTenantId(username, symbol, tenantId)
            .orElse(new Position(username, symbol, tenantId));

        if (isBuy) {
            // Weighted average cost: (oldQty * oldAvg + newQty * newPrice) / totalQty
            double newAvg = (position.getNetQuantity() == 0)
                ? tradePrice
                : (position.getNetQuantity() * position.getAvgCost() + quantity * tradePrice)
                / (position.getNetQuantity() + quantity);
            position.setAvgCost(newAvg);
            position.setNetQuantity(position.getNetQuantity() + quantity);
        } else {
            // Selling — avgCost doesn't change, just reduce quantity
            position.setNetQuantity(position.getNetQuantity() - quantity);
        }

        positionRepository.save(position);
    }
}
