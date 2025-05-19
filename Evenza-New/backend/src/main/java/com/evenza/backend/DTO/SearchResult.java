package com.evenza.backend.DTO;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
public class SearchResult {
    private String id;
    private String title;
    private String description;
    private String venue;
    private String location;
    private String imageurl;
    private LocalDate date;
    private LocalTime time;
    private String duration;
    private LocalDate releasedate;
    private BigDecimal rating;
    private String genre;
    private String language;
    private String cast;
    private String director;
    private String price;
    private String category;
}