package tech.smdey.toms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tech.smdey.toms.entity.Trade;

public interface TradeRepository extends JpaRepository<Trade, Long> {
}
