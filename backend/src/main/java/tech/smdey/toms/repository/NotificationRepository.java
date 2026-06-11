package tech.smdey.toms.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import tech.smdey.toms.entity.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUsernameAndTenantIdOrderByCreatedAtDesc(String username, String tenantId);
    long countByUsernameAndTenantIdAndReadFalse(String username, String tenantId);
}
