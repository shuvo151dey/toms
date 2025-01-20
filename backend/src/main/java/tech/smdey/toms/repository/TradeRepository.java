package tech.smdey.toms.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import tech.smdey.toms.entity.Trade;

public interface TradeRepository extends JpaRepository<Trade, Long> {
    List<Trade> findTop10ByOrderByTradeTimestampDesc();

    @Query("SELECT t FROM Trade t WHERE t.symbol = :symbol AND t.tradeTimestamp BETWEEN :from AND :to")
    List<Trade> findTrades(String symbol, LocalDateTime from, LocalDateTime to);
}
