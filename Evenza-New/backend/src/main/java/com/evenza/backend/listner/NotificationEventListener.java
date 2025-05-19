package com.evenza.backend.listner;

import com.evenza.backend.Event.NotificationEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

@Component
public class NotificationEventListener {
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private static final String QUEUE_NAME = "notification-queue";

    @EventListener
    public void onApplicationEvent(NotificationEvent event) {
        redisTemplate.opsForList().leftPush(QUEUE_NAME, event);
    }
}
