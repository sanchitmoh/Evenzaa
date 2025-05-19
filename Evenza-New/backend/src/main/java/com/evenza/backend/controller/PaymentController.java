package com.evenza.backend.controller;
import com.evenza.backend.DTO.PaymentRequest;
import com.evenza.backend.config.RazorpayConfig;
import com.evenza.backend.model.Payment;
import com.evenza.backend.repository.PaymentRepository;
import com.evenza.backend.services.PaymentService;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;
import java.util.HashMap;
import java.util.Collections;
import java.util.Optional;
import java.util.Date;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin
public class PaymentController {
    private static final Logger logger = LoggerFactory.getLogger(PaymentController.class);
    
    @Autowired
    private PaymentService paymentService;

    @Autowired
    private RazorpayConfig razorpayConfig;

    @Autowired
    private PaymentRepository paymentRepository;
    
    /**
     * Test endpoint to verify the controller is accessible and responding
     */
    @GetMapping("/test")
    public ResponseEntity<?> testEndpoint() {
        logger.info("PaymentController /test endpoint called");
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "PaymentController is working");
        response.put("timestamp", new Date());
        response.put("paymentCount", paymentRepository.count());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/create-order")
    public String createOrder(@RequestBody PaymentRequest paymentRequest) {
        try {
            RazorpayClient client = new RazorpayClient(
                    razorpayConfig.getKeyId(),
                    razorpayConfig.getKeySecret()
            );

            JSONObject options = new JSONObject();
            options.put("amount", paymentRequest.getAmount() * 100); // in paise
            options.put("currency", "INR");
            options.put("receipt", "receipt_" + System.currentTimeMillis());

            Order order = client.orders.create(options);
            return order.toString(); // Send order JSON to frontend
        } catch (Exception e) {
            return "{\"error\":\"" + e.getMessage() + "\"}";
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> payload) {
        return paymentService.verifyAndSavePayment(payload);
    }

    @GetMapping("/by-entity")
    public ResponseEntity<?> getPaymentsByEntity(
            @RequestParam String entityType,
            @RequestParam String entityId) {
        try {
            logger.info("Fetching payments for entity: {} with ID: {}", entityType, entityId);
            List<Payment> payments = paymentRepository.findByEntityTypeAndEntityId(entityType, entityId);
            logger.info("Found {} payments for entity: {} with ID: {}", payments.size(), entityType, entityId);
            return ResponseEntity.ok(payments);
        } catch (Exception e) {
            logger.error("Error fetching payments for entity: {} with ID: {}", entityType, entityId, e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/by-user")
    public ResponseEntity<?> getPaymentsByUser(@RequestParam String userId) {
        try {
            if (userId == null || userId.trim().isEmpty()) {
                logger.error("Invalid user ID provided: {}", userId);
                return ResponseEntity.badRequest().body(Map.of("error", "User ID is required"));
            }
            
            logger.info("Fetching payments for user ID: {}", userId);
            List<Payment> payments = paymentRepository.findByUserId(userId);
            logger.info("Found {} payments for user ID: {}", payments.size(), userId);
            return ResponseEntity.ok(payments);
        } catch (Exception e) {
            logger.error("Error fetching payments for user ID: {}", userId, e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserPayments(@PathVariable String userId) {
        try {
            if (userId == null || userId.trim().isEmpty()) {
                logger.error("Invalid user ID provided in path: {}", userId);
                return ResponseEntity.badRequest().body(Map.of("error", "User ID is required"));
            }
            
            logger.info("Fetching payments for user ID (path variable): {}", userId);
            List<Payment> payments = paymentRepository.findByUserId(userId);
            logger.info("Found {} payments for user ID: {}", payments.size(), userId);
            return ResponseEntity.ok(payments);
        } catch (Exception e) {
            logger.error("Error fetching payments for user ID: {}", userId, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to fetch payment history");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    @GetMapping("/{paymentId}")
    public ResponseEntity<?> getPaymentById(@PathVariable String paymentId) {
        try {
            logger.info("Fetching payment with ID: {}", paymentId);
            
            Long id;
            try {
                id = Long.parseLong(paymentId);
            } catch (NumberFormatException e) {
                logger.error("Invalid payment ID format: {}", paymentId);
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid payment ID format"));
            }
            
            Optional<Payment> paymentOpt = paymentRepository.findById(id);
            
            if (paymentOpt.isPresent()) {
                logger.info("Found payment with ID: {}", paymentId);
                return ResponseEntity.ok(paymentOpt.get());
            } else {
                logger.warn("Payment not found with ID: {}", paymentId);
                return ResponseEntity.status(404).body(Map.of("error", "Payment not found"));
            }
        } catch (Exception e) {
            logger.error("Error fetching payment with ID: {}", paymentId, e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
