package com.evenza.backend.services;

import com.evenza.backend.DTO.FirebaseLoginResponse;
import com.evenza.backend.DTO.UserDTO;
import com.evenza.backend.model.User;
import com.evenza.backend.repository.UserRepository;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.auth.FirebaseAuthException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class FirebaseService {
    private static final Logger logger = LoggerFactory.getLogger(FirebaseService.class);
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    public User authenticateFirebaseToken(String token) {
        try {
            if (token == null || token.trim().isEmpty()) {
                throw new IllegalArgumentException("ID token must not be null or empty");
            }
            
            logger.info("Verifying Firebase token (length: {})", token.length());
            
            // Clean the token
            String cleanToken = token.trim();
            
            try {
                // Verify the token with Firebase
                FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(cleanToken);
                
                String email = decodedToken.getEmail();
                String name = decodedToken.getName();
                String uid = decodedToken.getUid();
                
                logger.info("Firebase token verified for user: {}, uid: {}", email, uid);
                
                if (email == null || email.trim().isEmpty()) {
                    logger.error("Firebase token does not contain email");
                    throw new IllegalArgumentException("Firebase token must contain email");
                }
                
                // Determine provider
                String provider = "firebase";
                if (decodedToken.getClaims().containsKey("firebase") && 
                        decodedToken.getClaims().get("firebase") instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> firebaseData = (Map<String, Object>) decodedToken.getClaims().get("firebase");
                    if (firebaseData.containsKey("sign_in_provider")) {
                        provider = (String) firebaseData.get("sign_in_provider");
                    }
                }
                
                logger.info("Firebase token verified for user: {}, provider: {}", email, provider);
                
                // Check if user exists in database
                Optional<User> existingUser = userRepository.findByEmail(email);
                User user;
                
                if (existingUser.isPresent()) {
                    logger.info("User found in database: {}", email);
                    user = existingUser.get();
                    
                    // Update Firebase UID if it has changed
                    if (uid != null && !uid.equals(user.getUid())) {
                        user.setUid(uid);
                        user = userRepository.save(user);
                        logger.info("Updated Firebase UID for user: {}", email);
                    }
                } else {
                    logger.info("Creating new user for: {}", email);
                    // Create new user
                    user = new User();
                    user.setEmail(email);
                    user.setName(name != null && !name.isEmpty() ? name : email.split("@")[0]);
                    user.setUid(uid);
                    user.setProvider(provider);
                    user.setRole(User.Role.USER);
                    
                    // Generate a random password for users created via social login
                    String randomPassword = UUID.randomUUID().toString();
                    user.setPassword(passwordEncoder.encode(randomPassword));
                    
                    user = userRepository.save(user);
                    logger.info("New user created: {}", email);
                }
                
                return user;
            } catch (FirebaseAuthException e) {
                logger.error("Firebase auth exception: {}", e.getMessage());
                throw new RuntimeException("Firebase authentication failed: " + e.getMessage(), e);
            }
        } catch (Exception e) {
            logger.error("Error authenticating Firebase token", e);
            throw new RuntimeException("Invalid Firebase token: " + e.getMessage(), e);
        }
    }
}