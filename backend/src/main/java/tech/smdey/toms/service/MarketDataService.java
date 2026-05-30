package tech.smdey.toms.service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

@Service
public class MarketDataService {
    private final Map<String, Double> prices = new ConcurrentHashMap<>();

    public double getPrice(String ticker) {
        return prices.compute(ticker, (k, prev) -> {
            double base = (prev == null) ? 100.0 : prev;
            double fluctuation = base * (Math.random() * 0.04 - 0.02);
            return base + fluctuation;
        });
    }
}
