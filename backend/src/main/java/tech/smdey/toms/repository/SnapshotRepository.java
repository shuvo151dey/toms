package tech.smdey.toms.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import tech.smdey.toms.entity.AnalyticsSnapshot;

public interface SnapshotRepository extends JpaRepository<AnalyticsSnapshot, Long> {
    List<AnalyticsSnapshot> findBySymbolAndTenantIdOrderByTimestampAsc(String symbol, String tenantId);
}