package com.evenza.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
@Getter
@Setter
@Entity
@Table(name = "notifications")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Setter
    private Integer userId;

    @Setter
    private String message;

    @Setter
    @Getter
    private LocalDateTime createdAt = LocalDateTime.now();



}
