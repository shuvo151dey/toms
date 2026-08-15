package tech.smdey.toms.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Tenant {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String tenantId;   // e.g. "NSE" — the string User.tenantId links to

    private String name;       // display name, e.g. "National Stock Exchange"

    private Integer maxPosition;      // nullable — null means "use global default"
    private Double maxNotional;
    private Double dailyLossLimit;
    private Integer maxOrderQuantity;

    @CreationTimestamp
    private LocalDateTime createdAt;
    // getters/setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getMaxPosition() {
        return maxPosition;
    }

    public void setMaxPosition(Integer maxPosition) {
        this.maxPosition = maxPosition;
    }

    public Double getMaxNotional() {
        return maxNotional;
    }

    public void setMaxNotional(Double maxNotional) {
        this.maxNotional = maxNotional;
    }

    public Double getDailyLossLimit() {
        return dailyLossLimit;
    }

    public void setDailyLossLimit(Double dailyLossLimit) {
        this.dailyLossLimit = dailyLossLimit;
    }

    public Integer getMaxOrderQuantity() {
        return maxOrderQuantity;
    }

    public void setMaxOrderQuantity(Integer maxOrderQuantity) {
        this.maxOrderQuantity = maxOrderQuantity;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
