package tech.smdey.toms.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import tech.smdey.toms.service.MatchingEngineService;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping("/api/v1/matching")
public class MatchingController {

    @Autowired
    private MatchingEngineService matchingEngineService;

    @PostMapping("/{symbol}")
    public ResponseEntity<String> matchOrders(@PathVariable String symbol) {
        matchingEngineService.matchOrders(symbol);
        return ResponseEntity.ok("Matching process completed for symbol: " + symbol);
    }

    @PostMapping("/triggerstop/{symbol}")
    public ResponseEntity<String> triggerStop(@RequestBody double marketPrice, @PathVariable String symbol) {
        matchingEngineService.triggerStopOrders(symbol, marketPrice);
        return ResponseEntity.ok("Stop orders triggered for symbol: " + symbol);
    }
    
}
