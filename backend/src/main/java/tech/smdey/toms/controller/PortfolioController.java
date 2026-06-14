package tech.smdey.toms.controller;

import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tech.smdey.toms.entity.Position;
import tech.smdey.toms.entity.User;
import tech.smdey.toms.repository.PositionRepository;
import tech.smdey.toms.service.MarketDataService;

@RestController
@RequestMapping("/api/v1/portfolio")
public class PortfolioController {
    @Autowired private PositionRepository positionRepository;
    @Autowired private MarketDataService marketDataService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getPortfolio(@AuthenticationPrincipal User user) {
        List<Position> positions = positionRepository
            .findByUsernameAndTenantId(user.getUsername(), user.getTenantId());

        List<Map<String, Object>> result = positions.stream()
            .filter(p -> p.getNetQuantity() > 0)   // hide fully exited positions
            .map(p -> {
                double currentPrice = marketDataService.getLastPrice(p.getSymbol());
                double unrealisedPnl = (currentPrice - p.getAvgCost()) * p.getNetQuantity();
                return Map.<String, Object>of(
                    "symbol",       p.getSymbol(),
                    "netQuantity",  p.getNetQuantity(),
                    "avgCost",      p.getAvgCost(),
                    "currentPrice", currentPrice,
                    "unrealisedPnl", unrealisedPnl
                );
            })
            .toList();

        return ResponseEntity.ok(result);
    }
}
