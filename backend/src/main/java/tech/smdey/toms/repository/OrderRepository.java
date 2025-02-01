package tech.smdey.toms.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import tech.smdey.toms.entity.OrderStatus;
import tech.smdey.toms.entity.TradeOrder;

public interface OrderRepository extends JpaRepository<TradeOrder, Long> {
    Page<TradeOrder> findByStatus(OrderStatus status, Pageable pageable);

    @Query("SELECT o FROM TradeOrder o WHERE o.symbol = :symbol AND o.orderAction = 'BUY' AND o.status = 'PENDING'")
    List<TradeOrder> findUnmatchedBuyOrders(@Param("symbol") String symbol, Pageable pageable);

    @Query("SELECT o FROM TradeOrder o WHERE o.symbol = :symbol AND o.orderAction = 'SELL' AND o.status = 'PENDING'")
    List<TradeOrder> findUnmatchedSellOrders(@Param("symbol") String symbol, Pageable pageable);

    @Query("SELECT o FROM TradeOrder o WHERE o.symbol = :symbol AND o.orderMethod = 'STOP'")
    List<TradeOrder> findStopOrders(@Param("symbol") String symbol);

    @Query("SELECT o FROM TradeOrder o WHERE o.symbol = :symbol")
    List<TradeOrder> findOrdersBySymbol(String symbol);

    List<TradeOrder> findByTenantId(String tenantId);

    Optional<TradeOrder> findByIdAndTenantId(Long id, String tenantId);   
}
