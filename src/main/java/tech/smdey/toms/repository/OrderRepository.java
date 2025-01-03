package tech.smdey.toms.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import tech.smdey.toms.entity.TradeOrder;

public interface OrderRepository extends JpaRepository<TradeOrder, Long> {    
    
}
