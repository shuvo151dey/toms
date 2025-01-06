package tech.smdey.toms.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tech.smdey.toms.entity.Trade;
import tech.smdey.toms.service.TradeService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/trades")
public class TradeController {

    @Autowired
    private TradeService tradeService;

    @PostMapping
    public ResponseEntity<Trade> createTrade(@RequestBody Trade trade) {
        return ResponseEntity.ok(tradeService.createTrade(trade));
    }

    @GetMapping
    public ResponseEntity<List<Trade>> getAllTrades() {
        return ResponseEntity.ok(tradeService.getAllTrades());
    }
}
