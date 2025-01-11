package tech.smdey.toms.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.validation.Valid;
import tech.smdey.toms.entity.OrderStatus;
import tech.smdey.toms.entity.TradeOrder;
import tech.smdey.toms.repository.OrderRepository;
import tech.smdey.toms.service.KafkaProducerService;
import tech.smdey.toms.service.OrderCacheService;
import tech.smdey.toms.service.OrderService;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

@RestController
@RequestMapping("/api/v1/orders")
@Validated
public class OrderController {
    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderCacheService orderCacheService;

    @Autowired
    private KafkaProducerService kafkaProducerService;

    @PostMapping
    public ResponseEntity<TradeOrder> createOrder(@Valid @RequestBody TradeOrder order) {
        orderService.validateOrder(order);
        TradeOrder savedorder = orderRepository.save(order);
        orderCacheService.saveToCache(savedorder.getId(), savedorder);
        
        
        kafkaProducerService.sendOrderMessage(savedorder);
        return ResponseEntity.ok(savedorder);    
    }

    @GetMapping
    public ResponseEntity<Page<TradeOrder>> getOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        // Fetch paginated and filtered data
        Page<TradeOrder> orders;
        if (status != null) {
            orders = orderRepository.findByStatus(status, pageable);
        } else {
            orders = orderRepository.findAll(pageable);
        }

        return ResponseEntity.ok(orders);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<TradeOrder> getOrderById(@PathVariable Long id) {
        Optional<TradeOrder> cachedOrder = orderCacheService.getFromCache(id);
        if(cachedOrder.isPresent()){
            return ResponseEntity.ok(cachedOrder.get());
        }

        Optional<TradeOrder> order = orderRepository.findById(id);
        order.ifPresent(o -> orderCacheService.saveToCache(id,o));

        return order.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<TradeOrder> updateOrder(
            @PathVariable Long id, 
            @Valid @RequestBody TradeOrder updatedOrder) {
        
        // Check if the order exists
        Optional<TradeOrder> existingOrder = orderRepository.findById(id);
        
        if (existingOrder.isPresent()) {
            TradeOrder order = existingOrder.get();
            order.setSymbol(updatedOrder.getSymbol());
            order.setQuantity(updatedOrder.getQuantity());
        
            TradeOrder savedOrder = orderRepository.save(order);
            orderCacheService.saveToCache(id, savedOrder);
            return ResponseEntity.ok(savedOrder);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        if (orderRepository.existsById(id)) {
            orderRepository.deleteById(id);
            orderCacheService.deleteFromCache(id);
            return ResponseEntity.noContent().build(); // 204 No Content
        } else {
            return ResponseEntity.notFound().build(); // 404 Not Found
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TradeOrder> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam OrderStatus status) {

        Optional<TradeOrder> orderOptional = orderRepository.findById(id);
        if (orderOptional.isPresent()) {
            TradeOrder order = orderOptional.get();
            order.setStatus(status);
            orderRepository.save(order);
            return ResponseEntity.ok(order);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

}
