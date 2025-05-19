package com.evenza.backend.Event;

import lombok.Getter;

import java.io.Serializable;

@Getter
public class NotificationEvent implements Serializable {
    @Getter
    private final Integer userId ;
    private final String message;

    public NotificationEvent(Integer userId, String message) {
        this.userId = userId;

        this.message = message;
    }

}
