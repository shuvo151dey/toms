package tech.smdey.toms.controller;

import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RestController;


import jakarta.validation.Valid;
import tech.smdey.toms.dto.OrderRequest;
import tech.smdey.toms.entity.OrderAction;
import tech.smdey.toms.entity.OrderMethod;
import tech.smdey.toms.entity.OrderStatus;
import tech.smdey.toms.entity.TradeOrder;
import tech.smdey.toms.entity.User;
import tech.smdey.toms.repository.OrderRepository;
import tech.smdey.toms.service.KafkaProducerService;
import tech.smdey.toms.service.OrderCacheService;
import tech.smdey.toms.service.OrderService;
import tech.smdey.toms.service.MatchingEngineService;
import tech.smdey.toms.service.RiskService;
import tech.smdey.toms.util.JwtTokenUtil;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
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
    private final OrderRepository orderRepository;

    private final OrderService orderService;

    private final OrderCacheService orderCacheService;

    private final KafkaProducerService kafkaProducerService;

    private final JwtTokenUtil jwtTokenUtil;

    private final MatchingEngineService matchingEngineService;

    private final RiskService riskService;

    public OrderController(OrderRepository orderRepository, OrderService orderService,
            OrderCacheService orderCacheService, KafkaProducerService kafkaProducerService, JwtTokenUtil jwtTokenUtil, MatchingEngineService matchingEngineService, RiskService riskService) {
        this.orderRepository = orderRepository;
        this.orderService = orderService;
        this.orderCacheService = orderCacheService;
        this.kafkaProducerService = kafkaProducerService;
        this.jwtTokenUtil = jwtTokenUtil;
        this.matchingEngineService = matchingEngineService;
        this.riskService = riskService;
    }

    @PostMapping
    public ResponseEntity<TradeOrder> createOrder(
        @Valid @RequestBody OrderRequest order,
        @AuthenticationPrincipal User user,
        @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {

        if (idempotencyKey != null) {
            Optional<TradeOrder> cached = orderCacheService.getIdempotentResponse(idempotencyKey);
            if (cached.isPresent()){
                return ResponseEntity.ok(cached.get());
            }
        }

        TradeOrder newOrder = new TradeOrder();
        newOrder.setSymbol(order.getSymbol());
        newOrder.setQuantity(order.getQuantity());
        newOrder.setPrice(order.getPrice());
        newOrder.setLimitPrice(order.getLimitPrice());
        newOrder.setStopPrice(order.getStopPrice());
        newOrder.setOrderAction(OrderAction.valueOf(order.getOrderAction()));
        newOrder.setOrderMethod(OrderMethod.valueOf(order.getOrderMethod()));
        newOrder.setStatus(OrderStatus.PENDING);
        newOrder.setUsername(user.getUsername());
        newOrder.setTenantId(user.getTenantId());
        orderService.validateOrder(newOrder);
        try {
            riskService.checkRisk(newOrder);

        } catch (RuntimeException e) {
            kafkaProducerService.sendNotification(user.getUsername(), user.getTenantId(), "Order rejected: " + e.getMessage(), "ORDER_REJECTED");
            throw e;
        }
        orderRepository.save(newOrder);
        matchingEngineService.asyncMatchOrdersForSymbol(newOrder.getSymbol(), user.getTenantId());
        orderCacheService.saveToCache(newOrder.getId(), newOrder);
        kafkaProducerService.sendOrderMessage(newOrder);

        if (idempotencyKey != null) {
            orderCacheService.saveIdempotentResponse(idempotencyKey, newOrder);
        }
        return ResponseEntity.ok(newOrder);
    }

    @GetMapping
    public ResponseEntity<Page<TradeOrder>> getOrders(
            @AuthenticationPrincipal User user,
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
            orders = orderRepository.findByStatusAndTenantId(status, user.getTenantId(), pageable);
        } else {
            orders = orderRepository.findAll(pageable);
        }

        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TradeOrder> getOrderById(@PathVariable Long id,
            @RequestHeader("Authorization") String authheader) {

        String token = authheader.replace("Bearer ", "").trim();
        String tenantId = jwtTokenUtil.extractTenantId(token);

        Optional<TradeOrder> order = orderCacheService.getOrLoad(id, () -> orderRepository.findByIdAndTenantId(id, tenantId));

        return order.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<TradeOrder> updateOrder(
            @PathVariable Long id,
            @RequestBody TradeOrder updatedOrder,
            @RequestHeader("Authorization") String authheader) {
        String token = authheader.replace("Bearer ", "").trim();
        String tenantId = jwtTokenUtil.extractTenantId(token);
        Optional<TradeOrder> existingOrder = orderRepository.findByIdAndTenantId(id, tenantId);

        if (existingOrder.isPresent()) {
            TradeOrder order = existingOrder.get();

            // Allow updates only for PENDING or PARTIALLY_COMPLETED orders
            if (order.getStatus() == OrderStatus.PENDING || order.getStatus() == OrderStatus.PARTIALLY_COMPLETED) {
                order.setQuantity(updatedOrder.getQuantity());
                order.setPrice(updatedOrder.getPrice());
                order.setLimitPrice(updatedOrder.getLimitPrice());
                order.setStopPrice(updatedOrder.getStopPrice());
                TradeOrder savedOrder = orderRepository.save(order);
                orderCacheService.invalidate(id);
                // Notify via WebSocket
                kafkaProducerService.sendOrderMessage(savedOrder);

                return ResponseEntity.ok(savedOrder);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
            }
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelOrder(@PathVariable Long id, @RequestHeader("Authorization") String authheader) {
        String token = authheader.replace("Bearer ", "").trim();
        String tenantId = jwtTokenUtil.extractTenantId(token);
        Optional<TradeOrder> existingOrder = orderRepository.findByIdAndTenantId(id, tenantId);

        if (existingOrder.isPresent()) {
            TradeOrder order = existingOrder.get();

            // Allow cancellation only for PENDING or PARTIALLY_COMPLETED orders
            if (order.getStatus() == OrderStatus.PENDING || order.getStatus() == OrderStatus.PARTIALLY_COMPLETED) {
                order.setStatus(OrderStatus.CANCELED);
                orderRepository.save(order);
                orderCacheService.invalidate(id);
                // Notify via WebSocket
                kafkaProducerService.sendOrderMessage(order);

                return ResponseEntity.noContent().build();
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

}
