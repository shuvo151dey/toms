package tech.smdey.toms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Position {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    public Position() {}

    public Position(String username, String symbol, String tenantId) {
        this.username = username;
        this.symbol = symbol;
        this.tenantId = tenantId;
        this.netQuantity = 0;
        this.avgCost = 0.0;
    }

    @Column(nullable = false)
    private String symbol;

    @Column(nullable = false)
    private int netQuantity;

    @Column(nullable = false)
    private double avgCost;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private String tenantId;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public int getNetQuantity() {
        return netQuantity;
    }

    public void setNetQuantity(int netQuantity) {
        this.netQuantity = netQuantity;
    }

    public double getAvgCost() {
        return avgCost;
    }

    public void setAvgCost(double avgCost) {
        this.avgCost = avgCost;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }
}
