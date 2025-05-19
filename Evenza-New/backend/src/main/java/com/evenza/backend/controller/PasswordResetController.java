package com.evenza.backend.controller;

import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.evenza.backend.model.PasswordResetToken;
import com.evenza.backend.model.User;
import com.evenza.backend.repository.PasswordResetTokenRepository;
import com.evenza.backend.repository.UserRepository;
import com.evenza.backend.services.EmailService;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"})
public class PasswordResetController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/forgot-password")
    @Transactional
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            // Don't reveal that the user doesn't exist
            return ResponseEntity.ok().body(Map.of("message", "If an account exists with this email, you will receive password reset instructions."));
        }

        // Delete any existing tokens for this user
        tokenRepository.deleteByUser_Id(user.getId().longValue());

        // Create new token
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken(token, user);
        tokenRepository.save(resetToken);

        // Send email
        try {
            emailService.sendPasswordResetEmail(user.getEmail(), token);
            return ResponseEntity.ok().body(Map.of("message", "If an account exists with this email, you will receive password reset instructions."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Error sending reset email. Please try again later."));
        }
    }

    @PostMapping("/reset-password")
    @Transactional
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("newPassword");

        if (token == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Token and new password are required"));
        }

        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElse(null);

        if (resetToken == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired reset token"));
        }

        if (resetToken.isUsed()) {
            return ResponseEntity.badRequest().body(Map.of("message", "This reset token has already been used"));
        }

        if (resetToken.isExpired()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Reset token has expired"));
        }

        // Update user's password
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Mark token as used
        resetToken.setUsed(true);
        tokenRepository.save(resetToken);

        return ResponseEntity.ok().body(Map.of("message", "Password has been reset successfully"));
    }
} 