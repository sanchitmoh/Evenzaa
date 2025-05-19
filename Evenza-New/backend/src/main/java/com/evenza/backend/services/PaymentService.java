package com.evenza.backend.services;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.evenza.backend.config.RazorpayConfig;
import com.evenza.backend.model.Booking;
import com.evenza.backend.model.Payment;
import com.evenza.backend.model.Ticket;
import com.evenza.backend.repository.BookingRepository;
import com.evenza.backend.repository.PaymentRepository;

@Service
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private RazorpayConfig razorpayConfig;
    
    @Autowired
    private BookingRepository bookingRepository;
    
    @Autowired
    private TicketService ticketService;
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Value("${app.base.url:http://localhost:8080}")
    private String baseUrl;

    private static final int PAYMENT_CACHE_DURATION = 1; // hours
    private static final int TICKET_STATUS_CACHE_DURATION = 5; // minutes

    public ResponseEntity<?> verifyAndSavePayment(Map<String, String> payload) {
        try {
            System.out.println("Received payment verification payload: " + payload);
            
            String orderId = payload.get("razorpay_order_id");
            String paymentId = payload.get("razorpay_payment_id");
            String signature = payload.get("razorpay_signature");
            
            // Check Redis first for cached payment verification
            String paymentCacheKey = "payment:" + paymentId;
            Object cachedPayment = redisTemplate.opsForValue().get(paymentCacheKey);
            if (cachedPayment != null) {
                System.out.println("Returning cached payment verification result");
                return ResponseEntity.ok(cachedPayment);
            }
            
            // Validate required fields
            if (orderId == null || paymentId == null || signature == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "valid", false,
                    "error", "Missing required Razorpay fields"
                ));
            }
            
            // Quick validation of business fields
            if (!payload.containsKey("amount") || !payload.containsKey("entityType") || 
                !payload.containsKey("entityId") || !payload.containsKey("userId")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "valid", false,
                    "error", "Required business fields missing"
                ));
            }
            
            // Parse amount with error handling
            double amount;
            try {
                amount = Double.parseDouble(payload.get("amount").toString());
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body(Map.of(
                    "valid", false,
                    "error", "Invalid amount format"
                ));
            }
            
            String entityType = payload.get("entityType");
            String entityId = payload.get("entityId");
            String userId = payload.get("userId");

            // For testing purposes: always consider payment valid
            boolean isTestMode = true; // Set this to false in production
            boolean isValid = isTestMode || verifyRazorpaySignature(orderId, paymentId, signature);
            
            // Set status based on verification result
            String status = isValid ? "SUCCESS" : "FAILED";
            
            // Save payment record
            Payment payment = new Payment();
            payment.setRazorpayOrderId(orderId);
            payment.setRazorpayPaymentId(paymentId);
            payment.setRazorpaySignature(signature);
            payment.setAmount(amount);
            payment.setStatus(status);
            payment.setEntityType(entityType);
            payment.setEntityId(entityId);
            payment.setUserId(userId);

            Payment savedPayment = paymentRepository.save(payment);
            
            // Prepare response data
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("valid", isValid);
            responseData.put("paymentId", savedPayment.getId());
            responseData.put("status", savedPayment.getStatus());
            
            if (isValid) {
                // Generate booking immediately
                Booking booking = findOrCreateBooking(paymentId, entityType, entityId, userId, amount);
                responseData.put("bookingId", booking.getId().toString());
                
                // Set initial ticket status in Redis
                String ticketStatusKey = "ticketStatus:" + booking.getId().toString();
                Map<String, Object> initialStatus = Map.of(
                    "status", "PENDING",
                    "message", "Ticket generation initiated",
                    "timestamp", System.currentTimeMillis()
                );
                redisTemplate.opsForValue().set(
                    ticketStatusKey,
                    initialStatus,
                    TICKET_STATUS_CACHE_DURATION,
                    TimeUnit.MINUTES
                );
                
                // Start async ticket generation
                CompletableFuture.runAsync(() -> {
                    try {
                        generateTicketAsync(booking, entityType, entityId);
                    } catch (Exception e) {
                        System.err.println("Error in async ticket generation: " + e.getMessage());
                        updateTicketStatus(booking.getId().toString(), "ERROR", "Failed to generate ticket: " + e.getMessage());
                    }
                });
                
                responseData.put("message", "Payment verified successfully. Ticket generation started.");
                responseData.put("ticketStatus", "GENERATING");
            }
            
            // Cache the payment response
            redisTemplate.opsForValue().set(
                paymentCacheKey,
                responseData,
                PAYMENT_CACHE_DURATION,
                TimeUnit.HOURS
            );
            
            return ResponseEntity.ok(responseData);
            
        } catch (Exception e) {
            System.err.println("Error in payment verification: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "valid", false,
                "error", "Payment verification failed: " + e.getMessage()
            ));
        }
    }

    private boolean verifyRazorpaySignature(String orderId, String paymentId, String signature) {
        try {
            String data = orderId + "|" + paymentId;
            String generatedSignature = hmacSha256(data, razorpayConfig.getKeySecret());
            return generatedSignature.equals(signature);
        } catch (Exception e) {
            System.err.println("Error verifying signature: " + e.getMessage());
            return false;
        }
    }

    private void updateTicketStatus(String bookingId, String status, String message) {
        String ticketStatusKey = "ticketStatus:" + bookingId;
        Map<String, Object> statusUpdate = Map.of(
            "status", status,
            "message", message,
            "timestamp", System.currentTimeMillis()
        );
        redisTemplate.opsForValue().set(
            ticketStatusKey,
            statusUpdate,
            TICKET_STATUS_CACHE_DURATION,
            TimeUnit.MINUTES
        );
    }

    @Async
    public CompletableFuture<Ticket> generateTicketAsync(Booking booking, String entityType, String entityId) {
        try {
            updateTicketStatus(booking.getId().toString(), "PROCESSING", "Generating ticket...");
            
            // Generate ticket
            Ticket ticket = ticketService.generateTicket(
                booking.getId().toString(),
                getDefaultEntityName(entityType, entityId),
                getDefaultVenue(entityType),
                LocalDateTime.now().plusDays(7)
            );
            
            // Update status with success
            updateTicketStatus(booking.getId().toString(), "COMPLETED", "Ticket generated successfully");
            
            return CompletableFuture.completedFuture(ticket);
        } catch (Exception e) {
            updateTicketStatus(booking.getId().toString(), "ERROR", "Failed to generate ticket: " + e.getMessage());
            return CompletableFuture.failedFuture(e);
        }
    }
    
    /**
     * Get ticket generation status for a booking
     */
    public Map<String, Object> getTicketGenerationStatus(String bookingId) {
        String ticketStatusKey = "ticketStatus:" + bookingId;
        Object status = redisTemplate.opsForValue().get(ticketStatusKey);
        
        if (status == null) {
            // Check if ticket already exists in database
            List<Ticket> tickets = ticketService.getTicketsByBookingId(bookingId);
            if (!tickets.isEmpty()) {
                Ticket ticket = tickets.get(0);
                return Map.of(
                    "status", "COMPLETED",
                    "ticketId", ticket.getId(),
                    "pdfUrl", baseUrl + "/api/tickets/download/" + ticket.getId(),
                    "message", "Ticket has been generated successfully"
                );
            }
            
            // No ticket found and no status in Redis
            return Map.of(
                "status", "UNKNOWN",
                "message", "No ticket generation status found"
            );
        }
        
        return (Map<String, Object>) status;
    }
    
    /**
     * Get payments for a specific user
     */
    @Cacheable(value = "payments", key = "'user:' + #userId")
    public List<Payment> getUserPayments(String userId) {
        System.out.println("Fetching payments from database for user: " + userId);
        return paymentRepository.findByUserId(userId);
    }
    
    /**
     * Clear payment cache for a user
     */
    @CacheEvict(value = "payments", key = "'user:' + #userId")
    public void clearUserPaymentCache(String userId) {
        System.out.println("Clearing payment cache for user: " + userId);
    }
    
    /**
     * Clear ticket cache for a user
     */
    public void clearUserTicketCache(String userId) {
        System.out.println("Clearing ticket cache for user: " + userId);
        redisTemplate.delete("tickets:user:" + userId);
    }
    
    // Helper method to find or create a booking for the payment
    private Booking findOrCreateBooking(String paymentId, String entityType, String entityId, String userId, double amount) {
        // Check if booking already exists for this payment
        List<Booking> existingBookings = bookingRepository.findAll().stream()
            .filter(b -> paymentId.equals(b.getPaymentId()))
            .collect(java.util.stream.Collectors.toList());
            
        if (!existingBookings.isEmpty()) {
            return existingBookings.get(0);
        }
        
        // Create a new booking since one doesn't exist
        Booking booking = new Booking();
        booking.setEntityType(entityType);
        booking.setEntityId(entityId);
        booking.setUserId(userId);
        booking.setPaymentId(paymentId);
        booking.setAmount(amount);
        booking.setSeatId("AUTO-" + System.currentTimeMillis()); // Generate a temporary seat ID
        booking.setBookingTime(LocalDateTime.now());
        booking.setStatus("CONFIRMED");
        
        return bookingRepository.save(booking);
    }
    
    // Helper method to get default entity name
    private String getDefaultEntityName(String entityType, String entityId) {
        switch (entityType.toUpperCase()) {
            case "MOVIE":
                return "Movie Ticket #" + entityId;
            case "CONCERT":
                return "Concert Ticket #" + entityId;
            case "SPORTS":
                return "Sports Event #" + entityId;
            case "EVENT":
                return "Event Ticket #" + entityId;
            default:
                return entityType + " #" + entityId;
        }
    }
    
    // Helper method to get default venue
    private String getDefaultVenue(String entityType) {
        switch (entityType.toUpperCase()) {
            case "MOVIE":
                return "Evenza Cinema";
            case "CONCERT":
                return "Evenza Concert Hall";
            case "SPORTS":
                return "Evenza Sports Arena";
            case "EVENT":
                return "Evenza Event Center";
            default:
                return "Evenza Venue";
        }
    }

    private String hmacSha256(String data, String key) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes("UTF-8"), "HmacSHA256");
        mac.init(secretKeySpec);
        byte[] hash = mac.doFinal(data.getBytes("UTF-8"));
        return bytesToHex(hash);  // Razorpay uses hex format, not Base64
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder();
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
