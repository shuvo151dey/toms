package tech.smdey.toms.integrations;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.KafkaContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.utility.DockerImageName;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

import tech.smdey.toms.entity.OrderAction;
import tech.smdey.toms.entity.OrderMethod;
import tech.smdey.toms.entity.OrderStatus;
import tech.smdey.toms.entity.TradeOrder;
import tech.smdey.toms.entity.Trade;
import tech.smdey.toms.repository.OrderRepository;
import tech.smdey.toms.repository.TradeRepository;
import tech.smdey.toms.service.MatchingEngineService;

import java.util.List;

@SpringBootTest
@Testcontainers
class MatchingEngineIntegrationTest {
    
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(DockerImageName.parse("postgres:17"))
        .withDatabaseName("toms_db")
        .withUsername("toms_user")
        .withPassword("toms@123");
    
    @Container
    static KafkaContainer kafka = new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.5.0"));

    // Point Spring at the containers instead of the docker-compose services,
    // so tests never touch the local dev database
    @DynamicPropertySource
    static void overrideProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("kafka.bootstrap-servers", kafka::getBootstrapServers);
        registry.add("kafka.security.protocol", () -> "PLAINTEXT");
        registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
    }

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private TradeRepository tradeRepository;

    @Autowired
    private MatchingEngineService matchingEngineService;

    // Each test starts from an empty book — trades reference orders, so delete them first
    @BeforeEach
    void cleanDatabase() {
        tradeRepository.deleteAll();
        orderRepository.deleteAll();
    }
    
    // Tests here...
    @Test
    @DisplayName("Full order → trade flow: BUY MARKET matches SELL MARKET")
    void testFullOrderToTradeFlow() {
        // ARRANGE: Create a BUY MARKET order
        TradeOrder buyOrder = new TradeOrder();
        buyOrder.setOrderAction(OrderAction.BUY);
        buyOrder.setOrderMethod(OrderMethod.MARKET);
        buyOrder.setSymbol("AAPL");
        buyOrder.setPrice(100.0);
        buyOrder.setQuantity(10);
        buyOrder.setUsername("buyer");
        buyOrder.setTenantId("NSE");
        buyOrder.setStatus(OrderStatus.PENDING);
        
        // Create matching SELL MARKET order
        TradeOrder sellOrder = new TradeOrder();
        sellOrder.setOrderAction(OrderAction.SELL);
        sellOrder.setOrderMethod(OrderMethod.MARKET);
        sellOrder.setSymbol("AAPL");
        sellOrder.setPrice(100.0);
        sellOrder.setQuantity(10);
        sellOrder.setUsername("seller");
        sellOrder.setTenantId("NSE");
        sellOrder.setStatus(OrderStatus.PENDING);
        
        // Save orders to real database
        buyOrder = orderRepository.save(buyOrder);
        sellOrder = orderRepository.save(sellOrder);
        
        // ACT: Trigger matching engine
        matchingEngineService.matchOrdersForSymbol("AAPL", "NSE");
        
        // ASSERT: Verify trade was created
        List<Trade> trades = tradeRepository.findByTenantId("NSE");
        assertEquals(1, trades.size(), "One trade should be created");
        
        Trade trade = trades.get(0);
        assertEquals(10, trade.getQuantity(), "Trade should be for 10 shares");
        assertEquals(100.0, trade.getPrice(), "Trade price should be 100");
        assertEquals(buyOrder.getId(), trade.getBuyOrder().getId());
        assertEquals(sellOrder.getId(), trade.getSellOrder().getId());
        
        // Verify orders were updated
        TradeOrder updatedBuy = orderRepository.findById(buyOrder.getId()).orElse(null);
        TradeOrder updatedSell = orderRepository.findById(sellOrder.getId()).orElse(null);
        
        assertEquals(0, updatedBuy.getQuantity(), "Buy order quantity should be 0");
        assertEquals(OrderStatus.COMPLETED, updatedBuy.getStatus(), "Buy order should be COMPLETED");
        assertEquals(0, updatedSell.getQuantity(), "Sell order quantity should be 0");
        assertEquals(OrderStatus.COMPLETED, updatedSell.getStatus(), "Sell order should be COMPLETED");
    }

    @Test
    @DisplayName("Partial fill updates order status")
    void testPartialFillUpdatesOrderStatus() {
        // ARRANGE: Create a BUY LIMIT order
        TradeOrder buyOrder = new TradeOrder();
        buyOrder.setOrderAction(OrderAction.BUY);
        buyOrder.setOrderMethod(OrderMethod.LIMIT);
        buyOrder.setSymbol("AAPL");
        buyOrder.setPrice(100.0);
        buyOrder.setQuantity(10);
        buyOrder.setUsername("buyer");
        buyOrder.setTenantId("NSE");
        buyOrder.setStatus(OrderStatus.PENDING);

        // Create matching SELL LIMIT order
        TradeOrder sellOrder = new TradeOrder();
        sellOrder.setOrderAction(OrderAction.SELL);
        sellOrder.setOrderMethod(OrderMethod.LIMIT);
        sellOrder.setSymbol("AAPL");
        sellOrder.setPrice(100.0);
        sellOrder.setQuantity(5);
        sellOrder.setUsername("seller");
        sellOrder.setTenantId("NSE");
        sellOrder.setStatus(OrderStatus.PENDING);

        // Save orders to real database
        buyOrder = orderRepository.save(buyOrder);
        sellOrder = orderRepository.save(sellOrder);

        // ACT: Trigger matching engine
        matchingEngineService.matchOrdersForSymbol("AAPL", "NSE");

        // ASSERT: Verify trade was created
        List<Trade> trades = tradeRepository.findByTenantId("NSE");
        assertEquals(1, trades.size(), "One trade should be created");

        Trade trade = trades.get(0);
        assertEquals(5, trade.getQuantity(), "Trade should be for 5 shares");
        assertEquals(100.0, trade.getPrice(), "Trade price should be 100");
        assertEquals(buyOrder.getId(), trade.getBuyOrder().getId());
        assertEquals(sellOrder.getId(), trade.getSellOrder().getId());

        // Verify orders were updated
        TradeOrder updatedBuy = orderRepository.findById(buyOrder.getId()).orElse(null);
        TradeOrder updatedSell = orderRepository.findById(sellOrder.getId()).orElse(null);

        assertEquals(5, updatedBuy.getQuantity(), "Buy order quantity should be 5");
        assertEquals(OrderStatus.PARTIALLY_COMPLETED, updatedBuy.getStatus(), "Buy order should be PARTIALLY_COMPLETED");
        assertEquals(0, updatedSell.getQuantity(), "Sell order quantity should be 0");
        assertEquals(OrderStatus.COMPLETED, updatedSell.getStatus(), "Sell order should be COMPLETED");
    }

    @Test
    @DisplayName("Stop order conversion and matching")
    void testStopOrderConversionAndMatching() {
        // ARRANGE: Create a STOP SELL order with stopPrice 95
        TradeOrder stopOrder = new TradeOrder();
        stopOrder.setOrderAction(OrderAction.SELL);
        stopOrder.setOrderMethod(OrderMethod.STOP);
        stopOrder.setSymbol("AAPL");
        stopOrder.setPrice(95.0);
        stopOrder.setStopPrice(95.0);
        stopOrder.setQuantity(10);
        stopOrder.setUsername("seller");
        stopOrder.setTenantId("NSE");
        stopOrder.setStatus(OrderStatus.PENDING);

        // Create matching BUY MARKET order
        TradeOrder buyOrder = new TradeOrder();
        buyOrder.setOrderAction(OrderAction.BUY);
        buyOrder.setOrderMethod(OrderMethod.MARKET);
        buyOrder.setSymbol("AAPL");
        buyOrder.setPrice(100.0);
        buyOrder.setQuantity(10);
        buyOrder.setUsername("buyer");
        buyOrder.setTenantId("NSE");
        buyOrder.setStatus(OrderStatus.PENDING);

        // Save orders to real database
        stopOrder = orderRepository.save(stopOrder);
        buyOrder = orderRepository.save(buyOrder);

        // ACT: Trigger stop orders with market price 94 (below stopPrice 95, so STOP triggers)
        matchingEngineService.triggerStopOrders("AAPL", 94.0, "NSE");

        // ASSERT: Verify Stop Order was converted to MARKET
        TradeOrder updatedStopOrder = orderRepository.findById(stopOrder.getId()).orElse(null);
        assertEquals(OrderMethod.MARKET, updatedStopOrder.getOrderMethod(), "Stop order should be converted to MARKET");

        // ASSERT: Verify trade was created
        List<Trade> trades = tradeRepository.findByTenantId("NSE");
        assertEquals(1, trades.size(), "One trade should be created");

        // ASSERT: Trade executes between stop and buy
        Trade trade = trades.get(0);
        assertEquals(10, trade.getQuantity(), "Trade should be for 10 shares");
        assertEquals(95.0, trade.getPrice(), "Trade executes at the sell (stop) order's price");
        assertEquals(buyOrder.getId(), trade.getBuyOrder().getId());
        assertEquals(stopOrder.getId(), trade.getSellOrder().getId());

        // ASSERT: Both orders completed
        TradeOrder updatedBuy = orderRepository.findById(buyOrder.getId()).orElse(null);
        assertEquals(0, updatedBuy.getQuantity(), "Buy order quantity should be 0");
        assertEquals(OrderStatus.COMPLETED, updatedBuy.getStatus(), "Buy order should be COMPLETED");
        assertEquals(0, updatedStopOrder.getQuantity(), "Sell order quantity should be 0");
        assertEquals(OrderStatus.COMPLETED, updatedStopOrder.getStatus(), "Sell order should be COMPLETED");
    }

    @Test
    @DisplayName("Re-running the matching engine does not duplicate trades")
    void testKafkaIdempotency() {
        // ARRANGE: Create a matched BUY/SELL pair
        TradeOrder buyOrder = new TradeOrder();
        buyOrder.setOrderAction(OrderAction.BUY);
        buyOrder.setOrderMethod(OrderMethod.LIMIT);
        buyOrder.setSymbol("AAPL");
        buyOrder.setPrice(100.0);
        buyOrder.setQuantity(10);
        buyOrder.setUsername("buyer");
        buyOrder.setTenantId("NSE");
        buyOrder.setStatus(OrderStatus.PENDING);

        TradeOrder sellOrder = new TradeOrder();
        sellOrder.setOrderAction(OrderAction.SELL);
        sellOrder.setOrderMethod(OrderMethod.LIMIT);
        sellOrder.setSymbol("AAPL");
        sellOrder.setPrice(100.0);
        sellOrder.setQuantity(10);
        sellOrder.setUsername("seller");
        sellOrder.setTenantId("NSE");
        sellOrder.setStatus(OrderStatus.PENDING);

        buyOrder = orderRepository.save(buyOrder);
        sellOrder = orderRepository.save(sellOrder);

        // ACT: Trigger matching engine
        matchingEngineService.matchOrdersForSymbol("AAPL", "NSE");

        // ASSERT: Verify trade was created
        List<Trade> trades = tradeRepository.findByTenantId("NSE");
        assertEquals(1, trades.size(), "One trade should be created");

        // ACT: Re-run the matching engine — both orders are now COMPLETED
        matchingEngineService.matchOrdersForSymbol("AAPL", "NSE");

        // ASSERT: Verify no new trades were created
        trades = tradeRepository.findByTenantId("NSE");
        assertEquals(1, trades.size(), "No new trades should be created");
    }

    @Test
    @DisplayName("Multiple orders in same symbol")
    void testMultipleOrdersInSameSymbol() {
        // ARRANGE: Create BUY orders
        TradeOrder buyOrder1 = new TradeOrder();
        buyOrder1.setOrderAction(OrderAction.BUY);
        buyOrder1.setOrderMethod(OrderMethod.MARKET);
        buyOrder1.setSymbol("AAPL");
        buyOrder1.setPrice(100.0);
        buyOrder1.setQuantity(10);
        buyOrder1.setUsername("buyer1");
        buyOrder1.setTenantId("NSE");
        buyOrder1.setStatus(OrderStatus.PENDING);

        TradeOrder buyOrder2 = new TradeOrder();
        buyOrder2.setOrderAction(OrderAction.BUY);
        buyOrder2.setOrderMethod(OrderMethod.LIMIT);
        buyOrder2.setSymbol("AAPL");
        buyOrder2.setPrice(99.0);
        buyOrder2.setQuantity(5);
        buyOrder2.setUsername("buyer2");
        buyOrder2.setTenantId("NSE");
        buyOrder2.setStatus(OrderStatus.PENDING);

        // Create SELL orders to match
        TradeOrder sellOrder1 = new TradeOrder();
        sellOrder1.setOrderAction(OrderAction.SELL);
        sellOrder1.setOrderMethod(OrderMethod.MARKET);
        sellOrder1.setSymbol("AAPL");
        sellOrder1.setPrice(100.0);
        sellOrder1.setQuantity(10);
        sellOrder1.setUsername("seller1");
        sellOrder1.setTenantId("NSE");
        sellOrder1.setStatus(OrderStatus.PENDING);

        TradeOrder sellOrder2 = new TradeOrder();
        sellOrder2.setOrderAction(OrderAction.SELL);
        sellOrder2.setOrderMethod(OrderMethod.LIMIT);
        sellOrder2.setSymbol("AAPL");
        sellOrder2.setPrice(99.0);
        sellOrder2.setQuantity(5);
        sellOrder2.setUsername("seller2");
        sellOrder2.setTenantId("NSE");
        sellOrder2.setStatus(OrderStatus.PENDING);

        // Save all orders to real database
        buyOrder1 = orderRepository.save(buyOrder1);
        buyOrder2 = orderRepository.save(buyOrder2);
        sellOrder1 = orderRepository.save(sellOrder1);
        sellOrder2 = orderRepository.save(sellOrder2);

        // ACT: Trigger matching engine
        matchingEngineService.matchOrdersForSymbol("AAPL", "NSE");

        // ASSERT: Verify trades were created
        List<Trade> trades = tradeRepository.findByTenantId("NSE");
        assertEquals(2, trades.size(), "Two trades should be created");

        // ASSERT: Verify first trade (MARKET buy matches MARKET sell)
        Trade trade1 = trades.get(0);
        assertEquals(10, trade1.getQuantity(), "First trade should be for 10 shares");
        assertEquals(100.0, trade1.getPrice(), "First trade price should be 100");
        assertEquals(buyOrder1.getId(), trade1.getBuyOrder().getId());
        assertEquals(sellOrder1.getId(), trade1.getSellOrder().getId());

        // ASSERT: Verify second trade (LIMIT buy matches LIMIT sell)
        Trade trade2 = trades.get(1);
        assertEquals(5, trade2.getQuantity(), "Second trade should be for 5 shares");
        assertEquals(99.0, trade2.getPrice(), "Second trade price should be 99");
        assertEquals(buyOrder2.getId(), trade2.getBuyOrder().getId());
        assertEquals(sellOrder2.getId(), trade2.getSellOrder().getId());

        // ASSERT: Verify all orders completed
        assertEquals(OrderStatus.COMPLETED, orderRepository.findById(buyOrder1.getId()).orElse(null).getStatus());
        assertEquals(OrderStatus.COMPLETED, orderRepository.findById(buyOrder2.getId()).orElse(null).getStatus());
        assertEquals(OrderStatus.COMPLETED, orderRepository.findById(sellOrder1.getId()).orElse(null).getStatus());
        assertEquals(OrderStatus.COMPLETED, orderRepository.findById(sellOrder2.getId()).orElse(null).getStatus());
    }

}

