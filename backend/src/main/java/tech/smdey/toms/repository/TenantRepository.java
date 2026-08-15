package tech.smdey.toms.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import tech.smdey.toms.entity.Tenant;

public interface TenantRepository extends JpaRepository<Tenant, Long> {
    Optional<Tenant> findByTenantId(String tenantId);
    boolean existsByTenantId(String tenantId);
}
