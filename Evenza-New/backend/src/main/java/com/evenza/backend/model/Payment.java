package com.evenza.backend.model;

import java.io.Serializable;
import java.util.Date;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Entity
@Table(name = "payment")
@NoArgsConstructor
public class Payment implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Setter
    private String razorpayOrderId;
    @Setter
    private String razorpayPaymentId;
    @Setter
    private String razorpaySignature;

    @Setter
    private double amount;

    @Setter
    private String paymentMethod;

    @Setter
    private String status; // "SUCCESS" or "FAIL"

    @Setter
    private String entityType; // "MOVIE", "SPORTS", "EVENT"

    @Setter
    private String entityId; // ID of the movie, sports, or event

    @Setter
    private String userId; // ID of the user who made the payment
    
    @Setter
    private String orderId; // Order ID for the payment

    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt = new Date();

    // Getters and Setters

    // Optionally: Add toString(), equals(), hashCode() methods if needed
}




