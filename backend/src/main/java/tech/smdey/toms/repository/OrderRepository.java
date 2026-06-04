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
    @Query("SELECT o.price, SUM(o.quantity) FROM TradeOrder o WHERE o.symbol = :symbol AND o.tenantId = :tenantId AND o.status IN ('PENDING', 'PARTIALLY_COMPLETED') AND o.orderAction = 'BUY' GROUP BY o.price ORDER BY o.price DESC")
    List<Object[]> findBidLevels(@Param("symbol") String symbol, @Param("tenantId") String tenantId);

    @Query("SELECT o.price, SUM(o.quantity) FROM TradeOrder o WHERE o.symbol = :symbol AND o.tenantId = :tenantId AND o.status IN ('PENDING', 'PARTIALLY_COMPLETED') AND o.orderAction = 'SELL' GROUP BY o.price ORDER BY o.price ASC")
    List<Object[]> findAskLevels(@Param("symbol") String symbol, @Param("tenantId") String tenantId);

    Page<TradeOrder> findByStatusAndTenantId(OrderStatus status, String tenantId, Pageable pageable);

    @Query("SELECT o FROM TradeOrder o WHERE o.symbol = :symbol AND o.tenantId = :tenantId AND o.status = 'PENDING' AND o.orderAction = 'BUY' ORDER BY o.price DESC, o.timestamp ASC")
    List<TradeOrder> findUnmatchedBuyOrders(@Param("symbol") String symbol, @Param("tenantId") String tenantId, Pageable pageable);

    @Query("SELECT o FROM TradeOrder o WHERE o.symbol = :symbol AND o.tenantId = :tenantId AND o.status = 'PENDING' AND o.orderAction = 'SELL' ORDER BY o.price ASC, o.timestamp ASC")
    List<TradeOrder> findUnmatchedSellOrders(@Param("symbol") String symbol, @Param("tenantId") String tenantId, Pageable pageable);

    @Query("SELECT o FROM TradeOrder o WHERE o.symbol = :symbol AND o.orderMethod = 'STOP' AND o.tenantId = :tenantId")
    List<TradeOrder> findStopOrders(@Param("symbol") String symbol, @Param("tenantId") String tenantId);

    @Query("SELECT o FROM TradeOrder o WHERE o.symbol = :symbol AND o.tenantId = :tenantId")
    List<TradeOrder> findOrdersBySymbol(@Param("symbol") String symbol, @Param("tenantId") String tenantId);

    List<TradeOrder> findByTenantId(String tenantId);

    Optional<TradeOrder> findByIdAndTenantId(Long id, String tenantId);   
}
