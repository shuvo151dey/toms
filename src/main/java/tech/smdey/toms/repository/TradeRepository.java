package tech.smdey.toms.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import tech.smdey.toms.entity.Trade;

public interface TradeRepository extends JpaRepository<Trade, Long> {
    List<Trade> findTop10ByOrderByTradeTimestampDesc();
}
