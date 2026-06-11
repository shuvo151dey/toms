package tech.smdey.toms.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import tech.smdey.toms.entity.Notification;
import tech.smdey.toms.entity.User;
import tech.smdey.toms.repository.NotificationRepository;
import tech.smdey.toms.service.NotificationService;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {
    @Autowired private NotificationService notificationService;
    @Autowired private NotificationRepository notificationRepository;

    @GetMapping
    public List<Notification> getAllNotifications(@AuthenticationPrincipal User user) {
        return notificationRepository.findByUsernameAndTenantIdOrderByCreatedAtDesc(user.getUsername(), user.getTenantId());
    }

    @GetMapping("/unread-count")
    public Map<String, Long> getUnreadCount(@AuthenticationPrincipal User user) {
        return Map.of("count", notificationRepository.countByUsernameAndTenantIdAndReadFalse(user.getUsername(), user.getTenantId()));
    }

    @PutMapping("/{id}/read")
    public void markRead(@PathVariable Long id) {
        notificationService.markRead(id);
    }

    @PutMapping("/read-all")
    public void markAllRead(@AuthenticationPrincipal User user) {
        notificationService.markAllRead(user.getUsername(), user.getTenantId());
    }
}
