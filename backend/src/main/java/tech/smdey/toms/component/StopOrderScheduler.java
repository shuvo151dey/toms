package tech.smdey.toms.component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import tech.smdey.toms.entity.Symbol;
import tech.smdey.toms.repository.SymbolRepository;
import tech.smdey.toms.service.MarketDataService;
import tech.smdey.toms.service.MatchingEngineService;
import tech.smdey.toms.service.KafkaProducerService;

@Component
public class StopOrderScheduler {
    @Autowired private MarketDataService marketDataService;
    @Autowired private MatchingEngineService matchingEngineService;
    @Autowired private SymbolRepository symbolRepository;
    @Autowired private KafkaProducerService kafkaProducerService;

    @Scheduled(fixedDelay = 30000)
    public void evaluateStopOrders() {
        Map<String, List<String>> tenantsByTicker = symbolRepository.findAll().stream()
                .collect(Collectors.groupingBy(Symbol::getTicker, Collectors.mapping(Symbol::getTenantId, Collectors.toList())));
        tenantsByTicker.forEach((ticker, tenantIds) -> {
            double price = marketDataService.getPrice(ticker);
            tenantIds.forEach(tenantId -> {
                matchingEngineService.triggerStopOrders(ticker, price, tenantId);
                kafkaProducerService.sendPriceMessage(ticker, tenantId, price);
            });
        });
    }
}
