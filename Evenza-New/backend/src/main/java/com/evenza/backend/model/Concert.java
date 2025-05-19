package com.evenza.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "concerts")
@Data
public class Concert {
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
}

