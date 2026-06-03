package tech.smdey.toms.component;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

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
        symbolRepository.findAll().forEach(s -> {
            double price = marketDataService.getPrice(s.getTicker());
            matchingEngineService.triggerStopOrders(s.getTicker(), price, "NSE");
            kafkaProducerService.sendPriceMessage(s.getTicker(), "NSE", price);
        });
    }
}
