package tech.smdey.toms.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import tech.smdey.toms.entity.Trade;
import tech.smdey.toms.repository.TradeRepository;

@RestController
@RequestMapping("/api/v1/trades")
public class TradeController {

    @Autowired
    private TradeRepository tradeRepository;

    // Get recent trades
    @GetMapping("/recent")
    public List<Trade> getRecentTrades() {
        return tradeRepository.findTop10ByOrderByTradeTimestampDesc();
    }
}
