package tech.smdey.toms.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import tech.smdey.toms.entity.AnalyticsSnapshot;
import tech.smdey.toms.entity.User;
import tech.smdey.toms.repository.SnapshotRepository;
import tech.smdey.toms.service.AnalyticsService;

@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    @Autowired
    private SnapshotRepository snapshotRepository;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/trades")
    public Map<String, Object> getTradeAnalytics(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String symbol,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return analyticsService.getTradeAnalytics(symbol, user.getTenantId(), from, to);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/orders")
    public Map<String, Object> getOrderAnalytics(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String symbol) {
        return analyticsService.getOrderAnalytics(symbol, user.getTenantId());
    }

    @GetMapping("/pnl")
    public Map<String, Object> getPnl(@AuthenticationPrincipal User user) {
        return analyticsService.getPnl(user.getUsername(), user.getTenantId());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/snapshots")
    public List<AnalyticsSnapshot> getSnapshots(
            @AuthenticationPrincipal User user,
            @RequestParam String symbol) {
        return snapshotRepository.findBySymbolAndTenantIdOrderByTimestampAsc(symbol, user.getTenantId());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/volatility")
    public Map<String, Object> getVolatilityMetrics(
            @AuthenticationPrincipal User user,
            @RequestParam String symbol) {
        return analyticsService.getVolatilityMetrics(symbol, user.getTenantId());
    }
}
