package com.evenza.backend.controller;

import com.evenza.backend.model.Notification;
import com.evenza.backend.model.User;
import com.evenza.backend.que.NotificationPublisher;
import com.evenza.backend.repository.NotificationRepository;
import com.evenza.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notify")

public class NotificationController {
    @Autowired
    private NotificationPublisher publisher;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @PostMapping
    public ResponseEntity<String> sendNotification(@RequestParam Integer userId,
                                                   @RequestParam String message) {
        publisher.publish(userId, message);
        return ResponseEntity.ok("Notification queued");
    }

    @PostMapping("/all")
    public ResponseEntity<String> broadcastNotification(@RequestParam String message) {
        List<User> allUsers = userRepository.findAll();
        for (User user : allUsers) {
            publisher.publish(user.getId(), message);
        }
        return ResponseEntity.ok("Broadcasted notification to all users.");
    }
    @GetMapping
    public ResponseEntity<List<Notification>> getAllNotifications(@RequestParam Integer userId) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return ResponseEntity.ok(notifications);
    }

}
