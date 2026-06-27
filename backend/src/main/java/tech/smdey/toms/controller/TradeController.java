package tech.smdey.toms.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import tech.smdey.toms.entity.Trade;
import tech.smdey.toms.entity.User;
import tech.smdey.toms.repository.TradeRepository;

@RestController
@RequestMapping("/api/v1/trades")
public class TradeController {

    @Autowired
    private TradeRepository tradeRepository;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/recent")
    public List<Trade> getRecentTrades(@AuthenticationPrincipal User user) {
        return tradeRepository.findTop10ByTenantIdOrderByTradeTimestampDesc(user.getTenantId());
    }

    @GetMapping
    public ResponseEntity<Page<Trade>> getTrades(
        @AuthenticationPrincipal User user,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        String tenantId = user.getTenantId();
        Pageable pageable = PageRequest.of(page, size, Sort.by("tradeTimestamp").descending());
        Page<Trade> trades = (tenantId != null)
            ? tradeRepository.findByTenantId(tenantId, pageable)
            : tradeRepository.findAll(pageable);
        return ResponseEntity.ok(trades);
    }
}
