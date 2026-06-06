package tech.smdey.toms.component;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import tech.smdey.toms.entity.AnalyticsSnapshot;
import tech.smdey.toms.entity.Symbol;
import tech.smdey.toms.entity.Trade;
import tech.smdey.toms.repository.SnapshotRepository;
import tech.smdey.toms.repository.SymbolRepository;
import tech.smdey.toms.repository.TradeRepository;

@Component
public class AnalyticsSnapshotScheduler {

    @Autowired private SnapshotRepository snapshotRepository;
    @Autowired private TradeRepository tradeRepository;
    @Autowired private SymbolRepository symbolRepository;

    @Scheduled(cron = "0 0 * * * *")
    public void createHourlySnapshot() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime hourAgo = now.minusHours(1);

        List<Symbol> symbols = symbolRepository.findAll();
        for (Symbol symbol : symbols) {
            List<Trade> trades = tradeRepository.findTrades(symbol.getTicker(), "NSE", hourAgo, now);
            if (trades.isEmpty()) continue;

            double totalVolume = trades.stream().mapToDouble(t -> t.getQuantity()).sum();
            double totalWeighted = trades.stream().mapToDouble(t -> t.getPrice() * t.getQuantity()).sum();
            double vwap = totalWeighted / totalVolume;

            AnalyticsSnapshot snapshot = new AnalyticsSnapshot();
            snapshot.setSymbol(symbol.getTicker());
            snapshot.setTenantId("NSE");
            snapshot.setVwap(vwap);
            snapshot.setTotalVolume(totalVolume);
            snapshot.setTradeCount((long) trades.size());
            snapshotRepository.save(snapshot);
        }
    }
}