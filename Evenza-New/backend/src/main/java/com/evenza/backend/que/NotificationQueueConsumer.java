package com.evenza.backend.que;
import com.evenza.backend.model.Notification;
import com.evenza.backend.repository.NotificationRepository;
import com.evenza.backend.services.EmailService;
import com.evenza.backend.Event.NotificationEvent;
import com.evenza.backend.model.User;
import com.evenza.backend.repository.UserRepository;
import com.evenza.backend.services.WebSocketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Optional;
@Component
public class NotificationQueueConsumer {
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private WebSocketService webSocketService;

    @Autowired
    private NotificationRepository notificationRepository;

    @Scheduled(fixedDelay = 2000)
    public void consume() {
        String QUEUE_NAME = "notification-queue";
        NotificationEvent event = (NotificationEvent) redisTemplate.opsForList().rightPop(QUEUE_NAME);
        if (event == null) return;

        Optional<User> userOpt = userRepository.findById(Long.valueOf(event.getUserId()));
        if (userOpt.isEmpty()) return;

        User user = userOpt.get();
        String personalizedMessage = "Hi " + user.getName() + ",\n\n" + event.getMessage();
        //Email service
        emailService.sendEmail(user.getEmail(), "Notification", personalizedMessage);
        //Websocket service
        webSocketService.sendNotification(String.valueOf(user.getId()), personalizedMessage);

        // store notification
        Notification notification = new Notification();
        notification.setUserId(user.getId());
        notification.setMessage(event.getMessage());
        notification.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(notification);




    }
}
