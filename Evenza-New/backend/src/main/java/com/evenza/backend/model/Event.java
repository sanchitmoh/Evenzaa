package com.evenza.backend.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Entity
@Table(name = "events")
public class Event{

    // Getters and Setters
    @Getter
    @Id
    private String id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private LocalDate date;

    private LocalTime time;

    private String venue;

    private BigDecimal price;

    private String location;

    private String category;

    @Column(name="imageurl")
    private String imageurl;
    
    // No-args constructor required by JPA
    public Event() {
    }

    public Event(String id, String title, String description, LocalDate date, LocalTime time, String venue, BigDecimal price, String location, String category, String imageUrl) {

        this.id = id;
        this.title = title;
        this.description = description;
        this.date = date;
        this.time = time;
        this.venue = venue;
        this.price = price;
        this.location = location;
        this.category = category;
        this.imageurl = imageUrl;
    }
}