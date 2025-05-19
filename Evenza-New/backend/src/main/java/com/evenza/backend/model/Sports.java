package com.evenza.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Entity
@Table(name = "sports")
public class Sports {

    @Id
    private String id;
    private String title;
    private String description;
    private String date;
    private String time;
    private String venue;
    private double price;
    private String location;
    private String category;
    @Column(name="imageurl")
    private String imageurl;

    // Getters and setters

}
