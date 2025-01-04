package tech.smdey.toms.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import tech.smdey.toms.entity.OrderStatus;
import tech.smdey.toms.entity.TradeOrder;

public interface OrderRepository extends JpaRepository<TradeOrder, Long> {
    Page<TradeOrder> findByStatus(OrderStatus status, Pageable pageable);
}
