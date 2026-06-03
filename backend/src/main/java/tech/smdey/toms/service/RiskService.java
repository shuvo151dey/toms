package tech.smdey.toms.service;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import tech.smdey.toms.entity.OrderAction;
import tech.smdey.toms.entity.Position;
import tech.smdey.toms.entity.TradeOrder;
import tech.smdey.toms.repository.PositionRepository;

@Service
public class RiskService {
    private static final int MAX_POSITION = 500;
    private static final double MAX_NOTIONAL = 50000;
    private static final double DAILY_LOSS_LIMIT = 5000;

    @Autowired private PositionRepository positionRepository;
    @Autowired private MarketDataService marketDataService;

    public void checkRisk(TradeOrder order) {
        checkNotional(order);
        checkPositionLimit(order);
        checkDailyLossLimit(order);
    }

    private void checkNotional(TradeOrder order) {
        double notional = order.getPrice() * order.getQuantity();
        if (notional > MAX_NOTIONAL) {
            throw new IllegalArgumentException("Order notional $" + notional + " exceeds limit of $" + MAX_NOTIONAL);
        }
    }

    private void checkPositionLimit(TradeOrder order) {
        if (order.getOrderAction() != OrderAction.BUY) return;
        int current = positionRepository
            .findByUsernameAndSymbolAndTenantId(order.getUsername(), order.getSymbol(), order.getTenantId())
            .map(Position::getNetQuantity)
            .orElse(0);
        if (current + order.getQuantity() > MAX_POSITION) {
            throw new IllegalArgumentException("Position limit of " + MAX_POSITION + " shares exceeded for " + order.getSymbol());
        }
    }

    private void checkDailyLossLimit(TradeOrder order) {
        List<Position> positions = positionRepository.findByUsernameAndTenantId(order.getUsername(), order.getTenantId());
        double unrealisedLoss = positions.stream()
            .mapToDouble(p -> (marketDataService.getLastPrice(p.getSymbol()) - p.getAvgCost()) * p.getNetQuantity())
            .filter(pnl -> pnl < 0)
            .sum();
        if (Math.abs(unrealisedLoss) > DAILY_LOSS_LIMIT) {
            throw new IllegalArgumentException("Daily loss limit of $" + DAILY_LOSS_LIMIT + " exceeded");
        }
    }
}
