package tech.smdey.toms.controller;

import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tech.smdey.toms.entity.User;
import tech.smdey.toms.repository.OrderRepository;

@RestController
@RequestMapping("/api/v1/orderbook")
public class OrderBookController {
    @Autowired OrderRepository orderRepository;

    @GetMapping("/{symbol}")
    public ResponseEntity<Map<String, Object>> getOrderBook(
        @PathVariable String symbol,
        @AuthenticationPrincipal User user) {
            List<Map<String, Object>> bids = orderRepository
                .findBidLevels(symbol, user.getTenantId())
                .stream()
                .map(row -> Map.of("price", row[0], "quantity", row[1]))
                .toList();
            
            List<Map<String, Object>> asks = orderRepository
                .findAskLevels(symbol, user.getTenantId())
                .stream()
                .map(row -> Map.of("price", row[0], "quantity", row[1]))
                .toList();

            Map<String, Object> orderBook = Map.of("bids", bids, "asks", asks);
            return ResponseEntity.ok(orderBook);
    }
}
