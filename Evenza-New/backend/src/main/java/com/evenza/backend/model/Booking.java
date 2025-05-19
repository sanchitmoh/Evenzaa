package com.evenza.backend.model;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "bookings")
@Getter
@Setter
public class Booking implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String seatId;
    
    @Column(nullable = false)
    private String entityType; // "MOVIE", "SPORTS", "EVENT", "CONCERT"
    
    @Column(nullable = false)
    private String entityId;
    
    @Column(nullable = true)
    private String userId;
    
    @Column(nullable = true)
    private String paymentId;
    
    @Column(nullable = false)
    private double amount;

    
    @Column(nullable = false)
    private LocalDateTime bookingTime = LocalDateTime.now();
    
    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, RESERVED, CONFIRMED, CANCELLED, REFUNDED
    
    @Column(nullable = true)
    private LocalDateTime reservationExpiry;
    
    @Column(nullable = true)
    private String venue;
    
    @Column(nullable = true)
    private LocalDateTime createdAt;

    // Default constructor
    public Booking() {
        this.createdAt = LocalDateTime.now(); // Set default in constructor
    }

    // All-args constructor
    public Booking(Long id, String seatId, String entityType, String entityId, 
                  String userId, String paymentId, double amount) {
        this.id = id;
        this.seatId = seatId;
        this.entityType = entityType;
        this.entityId = entityId;
        this.userId = userId;
        this.paymentId = paymentId;
        this.amount = amount;
    }

    // Fixed constructor that actually sets the fields properly
    public Booking(Long id, String seatId, String entityType, String entityId, 
                  String userId, String paymentId, BigDecimal amount) {
        this.id = id;
        this.seatId = seatId;
        this.entityType = entityType;
        this.entityId = entityId;
        this.userId = userId;
        this.paymentId = paymentId;
        this.amount = amount != null ? amount.doubleValue() : 0.0;
    }

    // Constructor with venue
    public Booking(Long id, String seatId, String entityType, String entityId, 
                  String userId, String paymentId, double amount, String venue) {
        this.id = id;
        this.seatId = seatId;
        this.entityType = entityType;
        this.entityId = entityId;
        this.userId = userId;
        this.paymentId = paymentId;
        this.amount = amount;
        this.venue = venue;
    }

    // Optional builder-like method
    public static BookingBuilder builder() {
        return new BookingBuilder();
    }

    public String getEventImage() {
        if (entityType != null && entityType.equalsIgnoreCase("EVENT")) {
            return "https://example.com/event-image.jpg"; // Replace with actual logic
        }
        return null;
    }

    public static class BookingBuilder implements Serializable {
        private static final long serialVersionUID = 1L;
        
        private Long id;
        private String seatId;
        private String entityType;
        private String entityId;
        private String userId;
        private String paymentId;
        private BigDecimal amount;
        private String venue;
        private LocalDateTime createdAt = LocalDateTime.now();

        public BookingBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public BookingBuilder seatId(String seatId) {
            this.seatId = seatId;
            return this;
        }
        
        public BookingBuilder entityType(String entityType) {
            this.entityType = entityType;
            return this;
        }
        
        public BookingBuilder entityId(String entityId) {
            this.entityId = entityId;
            return this;
        }
        
        public BookingBuilder userId(String userId) {
            this.userId = userId;
            return this;
        }
        
        public BookingBuilder paymentId(String paymentId) {
            this.paymentId = paymentId;
            return this;
        }
        
        public BookingBuilder amount(BigDecimal amount) {
            this.amount = amount;
            return this;
        }
        
        public BookingBuilder venue(String venue) {
            this.venue = venue;
            return this;
        }
        
        public BookingBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Booking build() {
            Booking booking = new Booking(id, seatId, entityType, entityId, userId, paymentId, amount);
            booking.setVenue(venue);
            booking.setCreatedAt(createdAt);
            return booking;
        }
    }
}