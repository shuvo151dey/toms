package tech.smdey.toms.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import tech.smdey.toms.entity.OrderStatus;
import tech.smdey.toms.entity.TradeOrder;

public interface OrderRepository extends JpaRepository<TradeOrder, Long> {
    Page<TradeOrder> findByStatus(OrderStatus status, Pageable pageable);

    @Query("SELECT o FROM TradeOrder o WHERE o.symbol = :symbol AND o.type = 'BUY' AND o.status = 'PENDING'")
    List<TradeOrder> findUnmatchedBuyOrders(@Param("symbol") String symbol);

    @Query("SELECT o FROM TradeOrder o WHERE o.symbol = :symbol AND o.type = 'SELL' AND o.status = 'PENDING'")
    List<TradeOrder> findUnmatchedSellOrders(@Param("symbol") String symbol);
}
