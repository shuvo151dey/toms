package tech.smdey.toms.service;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import tech.smdey.toms.entity.OrderAction;
import tech.smdey.toms.entity.Position;
import tech.smdey.toms.entity.TradeOrder;
import tech.smdey.toms.repository.PositionRepository;

@Service
public class RiskService {
    @Value("${risk.limits.max-position:500}")
    private int maxPosition;
    @Value("${risk.limits.max-notional:50000}")
    private double maxNotional;
    @Value("${risk.limits.daily-loss-limit:5000}")
    private double dailyLossLimit;

    @Autowired private PositionRepository positionRepository;
    @Autowired private MarketDataService marketDataService;

    public void checkRisk(TradeOrder order) {
        checkNotional(order);
        checkPositionLimit(order);
        checkDailyLossLimit(order);
    }

    private void checkNotional(TradeOrder order) {
        double notional = order.getPrice() * order.getQuantity();
        if (notional > maxNotional) {
            throw new IllegalArgumentException("Order notional $" + notional + " exceeds limit of $" + maxNotional);
        }
    }

    private void checkPositionLimit(TradeOrder order) {
        if (order.getOrderAction() != OrderAction.BUY) return;
        int current = positionRepository
            .findByUsernameAndSymbolAndTenantId(order.getUsername(), order.getSymbol(), order.getTenantId())
            .map(Position::getNetQuantity)
            .orElse(0);
        if (current + order.getQuantity() > maxPosition) {
            throw new IllegalArgumentException("Position limit of " + maxPosition + " shares exceeded for " + order.getSymbol());
        }
    }

    private void checkDailyLossLimit(TradeOrder order) {
        List<Position> positions = positionRepository.findByUsernameAndTenantId(order.getUsername(), order.getTenantId());
        double unrealisedLoss = positions.stream()
            .mapToDouble(p -> (marketDataService.getLastPrice(p.getSymbol()) - p.getAvgCost()) * p.getNetQuantity())
            .filter(pnl -> pnl < 0)
            .sum();
        if (Math.abs(unrealisedLoss) > dailyLossLimit) {
            throw new IllegalArgumentException("Daily loss limit of $" + dailyLossLimit + " exceeded");
        }
    }
}
