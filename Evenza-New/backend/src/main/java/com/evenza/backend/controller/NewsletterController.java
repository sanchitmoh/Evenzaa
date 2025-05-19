package com.evenza.backend.controller;

import com.evenza.backend.services.NewsletterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/newsletter")
public class NewsletterController {

    @Autowired
    private NewsletterService newsletterService;

    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribe(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        
        // Validate email
        if (email == null || email.trim().isEmpty()) {
            Map<String, String> response = new HashMap<>();
            response.put("error", "Email is required");
            return ResponseEntity.badRequest().body(response);
        }
        
        boolean success = newsletterService.subscribe(email);
        
        Map<String, String> response = new HashMap<>();
        if (success) {
            response.put("message", "Successfully subscribed to the newsletter");
            return ResponseEntity.ok(response);
        } else {
            response.put("message", "Email already subscribed to the newsletter");
            return ResponseEntity.ok(response);
        }
    }
    
    @PostMapping("/unsubscribe")
    public ResponseEntity<?> unsubscribe(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        
        // Validate email
        if (email == null || email.trim().isEmpty()) {
            Map<String, String> response = new HashMap<>();
            response.put("error", "Email is required");
            return ResponseEntity.badRequest().body(response);
        }
        
        boolean success = newsletterService.unsubscribe(email);
        
        Map<String, String> response = new HashMap<>();
        if (success) {
            response.put("message", "Successfully unsubscribed from the newsletter");
            return ResponseEntity.ok(response);
        } else {
            response.put("message", "Email not found or already unsubscribed");
            return ResponseEntity.ok(response);
        }
    }
} 