package tech.smdey.toms.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

@Entity
public class Trade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "buy_order_id", nullable = false)
    private TradeOrder buyOrder;

    @ManyToOne
    @JoinColumn(name = "sell_order_id", nullable = false)
    private TradeOrder sellOrder;

    private String symbol;

    private Integer quantity;

    private Double price;

    private String tenantId;

    @CreationTimestamp
    private LocalDateTime tradeTimestamp;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public TradeOrder getBuyOrder() {
        return buyOrder;
    }

    public void setBuyOrder(TradeOrder tradeOrder) {
        this.buyOrder = tradeOrder;
    }

    public TradeOrder getSellOrder() {
        return sellOrder;
    }

    public void setSellOrder(TradeOrder tradeOrder) {
        this.sellOrder = tradeOrder;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public LocalDateTime getTradeTimestamp() {
        return tradeTimestamp;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }
}
