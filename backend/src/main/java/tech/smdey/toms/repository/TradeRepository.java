package tech.smdey.toms.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import tech.smdey.toms.entity.Trade;

public interface TradeRepository extends JpaRepository<Trade, Long> {
    List<Trade> findTop10ByTenantIdOrderByTradeTimestampDesc(String tenantId);

    @Query("SELECT t FROM Trade t WHERE t.symbol = :symbol AND t.tenantId = :tenantId AND t.tradeTimestamp BETWEEN :from AND :to")
    List<Trade> findTrades(@Param("symbol") String symbol, @Param("tenantId") String tenantId, LocalDateTime from, LocalDateTime to);

    List<Trade> findByTenantId(String tenantId);

    @Query("SELECT t FROM Trade t WHERE t.sellOrder.username = :username AND t.tenantId = :tenantId")
    List<Trade> findSellTradesByUsername(@Param("username") String username, @Param("tenantId") String tenantId);

    @Query("SELECT t FROM Trade t WHERE t.buyOrder.username = :username AND t.tenantId = :tenantId")
    List<Trade> findBuyTradesByUsername(@Param("username") String username, @Param("tenantId") String tenantId);

    Page<Trade> findByTenantId(String tenantId, Pageable pageable);
}
