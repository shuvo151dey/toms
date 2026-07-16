package tech.smdey.toms.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import tech.smdey.toms.entity.OrderAction;
import tech.smdey.toms.entity.OrderMethod;
import tech.smdey.toms.entity.TradeOrder;
import tech.smdey.toms.repository.OrderRepository;
import tech.smdey.toms.repository.SymbolRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("MatchingEngineService Tests")
public class MatchingEngineServiceTest {
    @Mock
    private OrderRepository orderRepository;

    @Mock
    private KafkaProducerService kafkaProducerService;

    @Mock
    private SymbolRepository symbolRepository;

    @Mock
    private TradeExecutorService tradeExecutorService;

    @InjectMocks
    private MatchingEngineService matchingEngineService;

    // The matching loop relies on executeTrade decrementing quantities to make
    // progress. The real TradeExecutorService does this; a bare mock would leave
    // quantities unchanged and the engine would loop forever (the OOM we saw).
    @BeforeEach
    void stubExecuteTrade() {
        lenient().doAnswer(invocation -> {
            TradeOrder buy = invocation.getArgument(0);
            TradeOrder sell = invocation.getArgument(1);
            int quantity = invocation.getArgument(2);
            buy.setQuantity(buy.getQuantity() - quantity);
            sell.setQuantity(sell.getQuantity() - quantity);
            return null;
        }).when(tradeExecutorService).executeTrade(any(TradeOrder.class), any(TradeOrder.class), anyInt());
    }

    // Monotonic counter so every order gets a distinct timestamp (id order = time order)
    private final AtomicLong tick = new AtomicLong(0);

    private TradeOrder createTradeOrder(Long id, OrderAction action, OrderMethod method,
                                   String symbol, Double price, int quantity, Double stopPrice) {
        TradeOrder order = new TradeOrder();
        order.setId(id);
        order.setOrderAction(action);
        order.setOrderMethod(method);
        order.setSymbol(symbol);
        if (price != null) order.setPrice(price);
        order.setQuantity(quantity);
        if (stopPrice != null) order.setStopPrice(stopPrice);
        order.setTenantId("NSE");
        order.setUsername("testuser");
        // @CreationTimestamp only fires on DB save — set explicitly for unit tests
        order.setTimestamp(LocalDateTime.of(2026, 1, 1, 0, 0).plusSeconds(tick.incrementAndGet()));
        return order;
    }

    @Test
    @DisplayName("Should execute full fill when quantities match")
    void testFullFill() {
        // 1. ARRANGE — create test data
        TradeOrder buyOrder = createTradeOrder(1L, OrderAction.BUY, OrderMethod.MARKET, "AAPL", 100.0, 10, null);
        TradeOrder sellOrder = createTradeOrder(2L, OrderAction.SELL, OrderMethod.MARKET, "AAPL", 100.0, 10, null);

        // 2. MOCK — tell the mock repository what to return
        when(orderRepository.findUnmatchedBuyOrders(eq("AAPL"), eq("NSE"), any(Pageable.class)))
            .thenReturn(Arrays.asList(buyOrder));
        when(orderRepository.findUnmatchedSellOrders(eq("AAPL"), eq("NSE"), any(Pageable.class)))
            .thenReturn(Arrays.asList(sellOrder));

        // 3. ACT — call the method you're testing
        matchingEngineService.matchOrdersForSymbol("AAPL", "NSE");

        // 4. ASSERT — verify the expected behavior
        verify(tradeExecutorService).executeTrade(buyOrder, sellOrder, 10);
    }

    @Test
    @DisplayName("Should execute partial fill when buy order is larger")
    void testPartialFillBuyLarger() {
        TradeOrder buyOrder = createTradeOrder(1L, OrderAction.BUY, OrderMethod.MARKET, "AAPL", 100.0, 20, null);
        TradeOrder sellOrder = createTradeOrder(2L, OrderAction.SELL, OrderMethod.MARKET, "AAPL", 100.0, 10, null);

        // 2. MOCK — tell the mock repository what to return
        when(orderRepository.findUnmatchedBuyOrders(eq("AAPL"), eq("NSE"), any(Pageable.class)))
            .thenReturn(Arrays.asList(buyOrder));
        when(orderRepository.findUnmatchedSellOrders(eq("AAPL"), eq("NSE"), any(Pageable.class)))
            .thenReturn(Arrays.asList(sellOrder));

        // 3. ACT — call the method you're testing
        matchingEngineService.matchOrdersForSymbol("AAPL", "NSE");

        // 4. ASSERT — verify the expected behavior
        verify(tradeExecutorService).executeTrade(buyOrder, sellOrder, 10);
    }

    @Test
    @DisplayName("Should execute partial fill when sell order is larger")
    void testPartialFillSellLarger() {
        TradeOrder buyOrder = createTradeOrder(1L, OrderAction.BUY, OrderMethod.MARKET, "AAPL", 100.0, 10, null);
        TradeOrder sellOrder = createTradeOrder(2L, OrderAction.SELL, OrderMethod.MARKET, "AAPL", 100.0, 20, null);

        // 2. MOCK — tell the mock repository what to return
        when(orderRepository.findUnmatchedBuyOrders(eq("AAPL"), eq("NSE"), any(Pageable.class)))
            .thenReturn(Arrays.asList(buyOrder));
        when(orderRepository.findUnmatchedSellOrders(eq("AAPL"), eq("NSE"), any(Pageable.class)))
            .thenReturn(Arrays.asList(sellOrder));

        // 3. ACT — call the method you're testing
        matchingEngineService.matchOrdersForSymbol("AAPL", "NSE");

        // 4. ASSERT — verify the expected behavior
        verify(tradeExecutorService).executeTrade(buyOrder, sellOrder, 10);
    }

    @Test
    @DisplayName("Should execute market orders before limit orders")
    void testMarketBeforeLimit() {
        TradeOrder buyOrder = createTradeOrder(1L, OrderAction.BUY, OrderMethod.MARKET, "AAPL", 100.0, 100, null);
        TradeOrder sellOrder = createTradeOrder(3L, OrderAction.SELL, OrderMethod.MARKET, "AAPL", 100.0, 100, null);
        TradeOrder buyOrder2 = createTradeOrder(2L, OrderAction.BUY, OrderMethod.LIMIT, "AAPL", 100.0, 99, null);

        // 2. MOCK — tell the mock repository what to return
        when(orderRepository.findUnmatchedBuyOrders(eq("AAPL"), eq("NSE"), any(Pageable.class)))
            .thenReturn(Arrays.asList(buyOrder, buyOrder2));
        when(orderRepository.findUnmatchedSellOrders(eq("AAPL"), eq("NSE"), any(Pageable.class)))
            .thenReturn(Arrays.asList(sellOrder));

        // 3. ACT — call the method you're testing
        matchingEngineService.matchOrdersForSymbol("AAPL", "NSE");

        // 4. ASSERT — verify the expected behavior
        verify(tradeExecutorService).executeTrade(buyOrder, sellOrder, 100);
    }

    @Test
    @DisplayName("Limit orders dont match when prices are misaligned")
    void testLimitOrdersDoNotMatchWhenPricesAreMisaligned() {
        TradeOrder buyOrder = createTradeOrder(1L, OrderAction.BUY, OrderMethod.LIMIT, "AAPL", 99.0, 10, null);
        TradeOrder sellOrder = createTradeOrder(2L, OrderAction.SELL, OrderMethod.LIMIT, "AAPL", 100.0, 10, null);

        // 2. MOCK — tell the mock repository what to return
        when(orderRepository.findUnmatchedBuyOrders(eq("AAPL"), eq("NSE"), any(Pageable.class)))
            .thenReturn(Arrays.asList(buyOrder));
        when(orderRepository.findUnmatchedSellOrders(eq("AAPL"), eq("NSE"), any(Pageable.class)))
            .thenReturn(Arrays.asList(sellOrder));

        // 3. ACT — call the method you're testing
        matchingEngineService.matchOrdersForSymbol("AAPL", "NSE");

        // 4. ASSERT — verify the expected behavior
        verify(tradeExecutorService, never()).executeTrade(any(), any(), anyInt());
    }

    @Test
    @DisplayName("Limit orders match when prices are aligned")
    void testLimitOrdersMatchWhenPricesAreAligned() {
        TradeOrder buyOrder = createTradeOrder(1L, OrderAction.BUY, OrderMethod.LIMIT, "AAPL", 101.0, 10, null);
        TradeOrder sellOrder = createTradeOrder(2L, OrderAction.SELL, OrderMethod.LIMIT, "AAPL", 100.0, 10, null);

        // 2. MOCK — tell the mock repository what to return
        when(orderRepository.findUnmatchedBuyOrders(eq("AAPL"), eq("NSE"), any(Pageable.class)))
            .thenReturn(Arrays.asList(buyOrder));
        when(orderRepository.findUnmatchedSellOrders(eq("AAPL"), eq("NSE"), any(Pageable.class)))
            .thenReturn(Arrays.asList(sellOrder));

        // 3. ACT — call the method you're testing
        matchingEngineService.matchOrdersForSymbol("AAPL", "NSE");

        // 4. ASSERT — verify the expected behavior
        verify(tradeExecutorService).executeTrade(buyOrder, sellOrder, 10);
    }

    @Test
    @DisplayName("SELL Stop Order triggers When Price Drops Below")
    void testSellStopOrdersWhenPriceDrops() {
        TradeOrder stopOrder = createTradeOrder(1L, OrderAction.SELL, OrderMethod.STOP, "AAPL", null, 10, 95.0);

        when(orderRepository.findStopOrders("AAPL", "NSE"))
            .thenReturn(Arrays.asList(stopOrder));

        matchingEngineService.triggerStopOrders("AAPL", 94.0, "NSE");

        assertEquals(OrderMethod.MARKET, stopOrder.getOrderMethod());

        verify(orderRepository).save(stopOrder);

        verify(kafkaProducerService).sendNotification(eq("testuser"), eq("NSE"), contains("Stop order triggered"), eq("STOP_TRIGGERED"));
    }

    @Test
    @DisplayName("BUY Stop Order Triggers When Price Rises Above")
    void testBuyStopOrderWhenPriceRises() {
        TradeOrder stopOrder = createTradeOrder(1L, OrderAction.BUY, OrderMethod.STOP, "AAPL", null, 10, 105.0);

        when(orderRepository.findStopOrders("AAPL", "NSE"))
            .thenReturn(Arrays.asList(stopOrder));

        matchingEngineService.triggerStopOrders("AAPL", 106.0, "NSE");

        assertEquals(OrderMethod.MARKET, stopOrder.getOrderMethod());

        verify(orderRepository).save(stopOrder);

        verify(kafkaProducerService).sendNotification(eq("testuser"), eq("NSE"), contains("Stop order triggered"), eq("STOP_TRIGGERED"));
    }

    @Test
    @DisplayName("Stop Order Doesn't Trigger If Price Outside Range")
    void testStopOrderDoesNotTriggerIfPriceOutsideRange() {
        TradeOrder stopOrder = createTradeOrder(1L, OrderAction.SELL, OrderMethod.STOP, "AAPL", null, 10, 95.0);

        when(orderRepository.findStopOrders("AAPL", "NSE"))
            .thenReturn(Arrays.asList(stopOrder));

        matchingEngineService.triggerStopOrders("AAPL", 100.0, "NSE");

        assertEquals(OrderMethod.STOP, stopOrder.getOrderMethod());

        verify(orderRepository, never()).save(stopOrder);

        verify(kafkaProducerService, never()).sendNotification(eq("testuser"), eq("NSE"), contains("Stop order triggered"), eq("STOP_TRIGGERED"));
    }
}
