package com.evenza.backend.controller;

import com.evenza.backend.model.Payment;
import com.evenza.backend.repository.PaymentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * A test controller for creating sample payment data
 * NOTE: This should be removed in production!
 */
@RestController
@RequestMapping("/api/test/payments")
@CrossOrigin
public class PaymentTestController {
    private static final Logger logger = LoggerFactory.getLogger(PaymentTestController.class);

    @Autowired
    private PaymentRepository paymentRepository;

    /**
     * Create sample payment records for testing
     * @param userId The user ID to create payments for
     * @param count Number of payments to create (default 3)
     * @return A response with the created payment IDs
     */
    @PostMapping("/create-samples/{userId}")
    public ResponseEntity<?> createSamplePayments(
            @PathVariable String userId,
            @RequestParam(defaultValue = "3") int count) {
        
        if (userId == null || userId.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "User ID is required"));
        }
        
        logger.info("Creating {} sample payments for user ID: {}", count, userId);
        
        List<Payment> createdPayments = new ArrayList<>();
        
        try {
            // Event types for random selection
            String[] entityTypes = {"MOVIE", "CONCERT", "SPORTS", "EVENT", "EXHIBITION"};
            String[] paymentMethods = {"CREDIT_CARD", "DEBIT_CARD", "UPI", "NETBANKING", "WALLET"};
            String[] statuses = {"SUCCESS", "SUCCESS", "SUCCESS", "FAIL"}; // 75% success rate
            
            Random random = new Random();
            
            for (int i = 0; i < count; i++) {
                Payment payment = new Payment();
                
                // Set user ID
                payment.setUserId(userId);
                
                // Set random values for testing
                payment.setRazorpayOrderId("order_" + UUID.randomUUID().toString().substring(0, 8));
                payment.setRazorpayPaymentId("pay_" + UUID.randomUUID().toString().substring(0, 10));
                payment.setRazorpaySignature("sign_" + UUID.randomUUID().toString().substring(0, 6));
                
                // Set random amount between 100 and 5000
                payment.setAmount(100 + random.nextInt(4900));
                
                // Set random entity type and ID
                String entityType = entityTypes[random.nextInt(entityTypes.length)];
                payment.setEntityType(entityType);
                payment.setEntityId("entity_" + (random.nextInt(100) + 1));
                
                // Set random payment method
                payment.setPaymentMethod(paymentMethods[random.nextInt(paymentMethods.length)]);
                
                // Set status (mostly success)
                payment.setStatus(statuses[random.nextInt(statuses.length)]);
                
                // Save the payment
                Payment savedPayment = paymentRepository.save(payment);
                createdPayments.add(savedPayment);
            }
            
            logger.info("Successfully created {} sample payments", createdPayments.size());
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", String.format("Created %d sample payments for user %s", createdPayments.size(), userId));
            response.put("count", createdPayments.size());
            response.put("paymentIds", createdPayments.stream().map(p -> p.getId()).toList());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error creating sample payments for user ID: {}", userId, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to create sample payments");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * List all payments in the system
     */
    @GetMapping("/list-all")
    public ResponseEntity<?> listAllPayments() {
        try {
            logger.info("Listing all payments");
            List<Payment> allPayments = paymentRepository.findAll();
            logger.info("Found {} total payments", allPayments.size());
            return ResponseEntity.ok(allPayments);
        } catch (Exception e) {
            logger.error("Error listing all payments", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Delete all payments in the system - USE WITH CAUTION!
     */
    @DeleteMapping("/delete-all")
    public ResponseEntity<?> deleteAllPayments() {
        try {
            logger.warn("Deleting ALL payments from the system");
            long count = paymentRepository.count();
            paymentRepository.deleteAll();
            logger.warn("Successfully deleted {} payments", count);
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", String.format("Deleted %d payments", count),
                "count", count
            ));
        } catch (Exception e) {
            logger.error("Error deleting all payments", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
} 