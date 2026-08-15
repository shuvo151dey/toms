package tech.smdey.toms.service;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import tech.smdey.toms.entity.OrderAction;
import tech.smdey.toms.entity.Position;
import tech.smdey.toms.entity.Tenant;
import tech.smdey.toms.entity.TradeOrder;
import tech.smdey.toms.exception.RiskLimitException;
import tech.smdey.toms.repository.PositionRepository;
import tech.smdey.toms.repository.TenantRepository;

@Service
public class RiskService {
    @Value("${risk.limits.max-position:500}")
    private int defaultMaxPosition;
    @Value("${risk.limits.max-notional:50000}")
    private double defaultMaxNotional;
    @Value("${risk.limits.daily-loss-limit:5000}")
    private double defaultDailyLossLimit;

    @Autowired private PositionRepository positionRepository;
    @Autowired private MarketDataService marketDataService;
    @Autowired private TenantRepository tenantRepository;

    public void checkRisk(TradeOrder order) {
        checkNotional(order);
        checkPositionLimit(order);
        checkDailyLossLimit(order);
    }

    private void checkNotional(TradeOrder order) {
        double notional = order.getPrice() * order.getQuantity();
        double maxNotional = resolveMaxNotional(order.getTenantId());
        if (notional > maxNotional) {
            throw new RiskLimitException("Order notional $" + notional + " exceeds limit of $" + maxNotional);
        }
    }

    private void checkPositionLimit(TradeOrder order) {
        if (order.getOrderAction() != OrderAction.BUY) return;
        int current = positionRepository
            .findByUsernameAndSymbolAndTenantId(order.getUsername(), order.getSymbol(), order.getTenantId())
            .map(Position::getNetQuantity)
            .orElse(0);
        int maxPosition = resolveMaxPosition(order.getTenantId());
        if (current + order.getQuantity() > maxPosition) {
            throw new RiskLimitException("Position limit of " + maxPosition + " shares exceeded for " + order.getSymbol());
        }
    }

    private void checkDailyLossLimit(TradeOrder order) {
        List<Position> positions = positionRepository.findByUsernameAndTenantId(order.getUsername(), order.getTenantId());
        double unrealisedLoss = positions.stream()
            .mapToDouble(p -> (marketDataService.getLastPrice(p.getSymbol()) - p.getAvgCost()) * p.getNetQuantity())
            .filter(pnl -> pnl < 0)
            .sum();
        double dailyLossLimit = resolveDailyLossLimit(order.getTenantId());
        if (Math.abs(unrealisedLoss) > dailyLossLimit) {
            throw new RiskLimitException("Daily loss limit of $" + dailyLossLimit + " exceeded");
        }
    }

    // Per-tenant overrides, falling back to the global defaults above when the
    // tenant doesn't exist or has left the field blank (nullable on Tenant).
    private Tenant resolveTenant(String tenantId) {
        return tenantRepository.findByTenantId(tenantId).orElse(null);
    }

    private int resolveMaxPosition(String tenantId) {
        Tenant tenant = resolveTenant(tenantId);
        return (tenant != null && tenant.getMaxPosition() != null) ? tenant.getMaxPosition() : defaultMaxPosition;
    }

    private double resolveMaxNotional(String tenantId) {
        Tenant tenant = resolveTenant(tenantId);
        return (tenant != null && tenant.getMaxNotional() != null) ? tenant.getMaxNotional() : defaultMaxNotional;
    }

    private double resolveDailyLossLimit(String tenantId) {
        Tenant tenant = resolveTenant(tenantId);
        return (tenant != null && tenant.getDailyLossLimit() != null) ? tenant.getDailyLossLimit() : defaultDailyLossLimit;
    }
}
