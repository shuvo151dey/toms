package tech.smdey.toms.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import tech.smdey.toms.entity.Notification;
import tech.smdey.toms.entity.NotificationType;
import tech.smdey.toms.repository.NotificationRepository;

@Service
public class NotificationService {
    @Autowired private NotificationRepository notificationRepository;

    public void notify(String username, String tenantId, String type, String message) {
        Notification notification = new Notification();
        notification.setUsername(username);
        notification.setTenantId(tenantId);
        notification.setType(NotificationType.valueOf(type));
        notification.setMessage(message);
        notificationRepository.save(notification);
    }

    public void markRead(Long id) {
        notificationRepository.findById(id).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }

    public void markAllRead(String username, String tenantId) {
        List<Notification> unread = notificationRepository
            .findByUsernameAndTenantIdOrderByCreatedAtDesc(username, tenantId)
            .stream()
            .filter(n -> !n.isRead())
            .collect(Collectors.toList());
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }
}
