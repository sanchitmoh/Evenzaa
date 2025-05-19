package com.evenza.backend.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "sports")
@Data
@NoArgsConstructor
public class Sport {
    
    @Id
    private String id;
    
    private String title;
    private String description;
    private LocalDate date;
    private LocalTime time;
    private String venue;
    private BigDecimal price;
    private String location;
    private String category;
    @Column(name="imageurl")
    private String imageurl;
    
    private String sportType;
    private String teams;
    private String league;
    private String season;
    private Integer capacity;
    
    public Sport(String id, String title, String description, LocalDate date, LocalTime time, 
                String venue, BigDecimal price, String location, String category, String imageurl,
                String sportType, String teams, String league, String season, Integer capacity) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.date = date;
        this.time = time;
        this.venue = venue;
        this.price = price;
        this.location = location;
        this.category = category;
        this.imageurl = imageurl;
        this.sportType = sportType;
        this.teams = teams;
        this.league = league;
        this.season = season;
        this.capacity = capacity;
    }
} 