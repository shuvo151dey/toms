package tech.smdey.toms.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import tech.smdey.toms.entity.Trade;
import tech.smdey.toms.repository.TradeRepository;
import tech.smdey.toms.util.JwtTokenUtil;

@RestController
@RequestMapping("/api/v1/trades")
public class TradeController {

    @Autowired
    private TradeRepository tradeRepository;

    @Autowired
    private JwtTokenUtil jwtUtil;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/recent")
    public List<Trade> getRecentTrades() {
        return tradeRepository.findTop10ByOrderByTradeTimestampDesc();
    }

    @GetMapping
    public ResponseEntity<List<Trade>> getTrades(@RequestHeader("Authorization") String authheader) {
        String token = authheader.replace("Bearer ", "").trim();
        String tenantId = jwtUtil.extractTenantId(token); 
        List<Trade> trades = (tenantId != null) ? tradeRepository.findByTenantId(tenantId) : tradeRepository.findAll();
        return ResponseEntity.ok(trades);
    }
}
