package com.evenza.backend.model;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "movies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class Movie {

    @Id
    private String id;

    private String title;

    private String description;

    @Column(columnDefinition = "json")
    private String genre;

    @Column(name = "releasedate")
    private LocalDate releaseDate;

    private BigDecimal rating;
    @Column(name="imageurl")
    private String imageurl;

    private String duration;

    @Column(columnDefinition = "json")
    private String cast;

    private String director;

    private String language;

    private String price;

    private String location;
    @Setter
    private String category;


    public LocalDate getReleasedate() {
        return releaseDate;
    }
}
