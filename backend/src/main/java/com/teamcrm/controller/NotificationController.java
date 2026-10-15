package com.teamcrm.controller;

import com.teamcrm.entity.Notification;
import com.teamcrm.repository.NotificationRepository;
import com.teamcrm.security.UserDetailsImpl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationRepository notificationRepository;

    public NotificationController(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getMyNotifications(
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(notificationRepository.findByRecipientIdOrderByCreatedAtDesc(currentUser.getId()));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setIsRead(true);
            notificationRepository.save(n);
        });
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(@AuthenticationPrincipal UserDetailsImpl currentUser) {
        List<Notification> unread = notificationRepository.findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(currentUser.getId());
        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);
        return ResponseEntity.ok().build();
    }
}
