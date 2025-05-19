package com.evenza.backend.que;

import com.evenza.backend.Event.NotificationEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

@Service
public class NotificationPublisher {
    @Autowired
    private ApplicationEventPublisher publisher;

    public void publish(Integer userId, String message) {
        publisher.publishEvent(new NotificationEvent(userId, message));
    }

}
