package tech.smdey.toms.controller;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import tech.smdey.toms.service.AnalyticsService;

@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    @GetMapping("/trades")
    public Map<String, Object> getTradeAnalytics(
            @RequestParam(required = false) String symbol,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {

        return analyticsService.getTradeAnalytics(symbol, from, to);
    }

    @GetMapping("/orders")
    public Map<String, Object> getOrderAnalytics(
            @RequestParam(required = false) String symbol) {
        return analyticsService.getOrderAnalytics(symbol);
    }

}
