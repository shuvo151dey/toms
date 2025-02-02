package tech.smdey.toms.controller;

import org.apache.kafka.common.protocol.types.Field.Str;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import tech.smdey.toms.service.MatchingEngineService;
import tech.smdey.toms.util.JwtTokenUtil;

import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;


@RestController
@PreAuthorize("hasRole('ADMIN')")
@RequestMapping("/api/v1/matching")
public class MatchingController {

    @Autowired
    private MatchingEngineService matchingEngineService;

    @Autowired
    private JwtTokenUtil jwtUtil;

    @PostMapping
    public ResponseEntity<String> matchOrders(@RequestHeader("Authorization") String authheader) {
        String token = authheader.replace("Bearer ", "").trim();
        String tenantId = jwtUtil.extractTenantId(token);
        matchingEngineService.matchOrders(tenantId);
        return ResponseEntity.ok("Matching process completed for tenantId: " + tenantId);
    }

    @PostMapping("/triggerstop/{symbol}")
    public ResponseEntity<String> triggerStop(@RequestHeader("Authorization") String authheader,
            @RequestBody double marketPrice, @PathVariable String symbol) {
        String token = authheader.replace("Bearer ", "").trim();
        String tenantId = jwtUtil.extractTenantId(token);
        matchingEngineService.triggerStopOrders(symbol, marketPrice, tenantId);
        return ResponseEntity.ok("Stop orders triggered for symbol: " + symbol);
    }
    
}
