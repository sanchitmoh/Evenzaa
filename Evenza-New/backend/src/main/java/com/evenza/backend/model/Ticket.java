package com.evenza.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "tickets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ticket {
    
    @Id
    private String id;
    
    @Column(nullable = false)
    private String bookingId;
    
    @Column(nullable = false)
    private String userId;
    
    @Column(nullable = false)
    private String userEmail;
    
    @Column(nullable = false)
    private String entityType; // MOVIE, CONCERT, SPORTS, EVENT
    
    @Column(nullable = false)
    private String entityId;
    
    @Column(nullable = false)
    private String entityName;
    
    @Column(nullable = false)
    private String seatId;
    
    @Column
    private String pdfUrl;
    
    @Column
    private String qrCodeData;
    
    @Column(nullable = false)
    private Boolean isUsed = false;
    
    @Column(nullable = false)
    private LocalDateTime eventDateTime;
    
    @Column(nullable = false)
    private String venue;
    
    @Column
    private String eventImage;
    
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column
    private LocalDateTime updatedAt;
    
    // Convenience method to check if ticket is valid for entry
    public boolean isValid() {
        return !isUsed && eventDateTime.isAfter(LocalDateTime.now());
    }
    
    // Convenience method to mark ticket as used
    public void markAsUsed() {
        this.isUsed = true;
        this.updatedAt = LocalDateTime.now();
    }
} 