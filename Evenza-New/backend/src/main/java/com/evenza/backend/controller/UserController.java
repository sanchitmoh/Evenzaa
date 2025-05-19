package com.evenza.backend.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.evenza.backend.model.User;
import com.evenza.backend.repository.UserRepository;
import com.evenza.backend.services.UserService;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"})
public class UserController {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    private static final String USER_CACHE_KEY_PREFIX = "USER:";

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable String id) {
        try {
            // Try to get from Redis cache first
            String cacheKey = USER_CACHE_KEY_PREFIX + id;
            Object cachedData = redisTemplate.opsForValue().get(cacheKey);
            
            // Handle potential deserialization issues
            User cachedUser = null;
            if (cachedData instanceof User) {
                cachedUser = (User) cachedData;
            } else if (cachedData != null) {
                // Log the issue and continue with database lookup
                System.out.println("Warning: Cache returned non-User object: " + cachedData.getClass().getName());
            }
            
            if (cachedUser != null) {
                return ResponseEntity.ok(cachedUser);
            }
            
            // If not in cache, get from database
            Optional<User> userOpt = userRepository.findByUid(id);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "User not found"));
            }
            
            User user = userOpt.get();
            
            // Cache the user for future requests - use try-catch to prevent caching errors
            try {
                redisTemplate.opsForValue().set(cacheKey, user, 1, TimeUnit.HOURS);
            } catch (Exception e) {
                System.out.println("Failed to cache user: " + e.getMessage());
            }
            
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch user: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable String id, @RequestBody User updatedUser) {
        try {
            Optional<User> userOpt = userRepository.findByUid(id);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "User not found"));
            }
            
            User user = userOpt.get();
            
            // Update user fields
            if (updatedUser.getName() != null) {
                user.setName(updatedUser.getName());
            }
            
            if (updatedUser.getEmail() != null) {
                user.setEmail(updatedUser.getEmail());
            }
            
            if (updatedUser.getPhone() != null) {
                user.setPhone(updatedUser.getPhone());
            }
            
            if (updatedUser.getAddress() != null) {
                user.setAddress(updatedUser.getAddress());
            }
            
            // Save updated user
            User savedUser = userRepository.save(user);
            
            // Update Redis cache
            String cacheKey = USER_CACHE_KEY_PREFIX + id;
            redisTemplate.opsForValue().set(cacheKey, savedUser, 1, TimeUnit.HOURS);
            
            return ResponseEntity.ok(savedUser);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update user: " + e.getMessage()));
        }
    }
    
    @GetMapping("/{id}/dashboard")
    public ResponseEntity<?> getUserDashboard(@PathVariable String id) {
        try {
            System.out.println("Dashboard API called for user ID: " + id);
            
            // Get user profile safely with error handling
            Optional<User> userOpt = userRepository.findByUid(id);
            
            if (userOpt.isEmpty()) {
                System.out.println("User not found with UID: " + id);
                
                // Try by numeric ID if UID fails
                try {
                    Integer numericId = Integer.parseInt(id);
                    userOpt = userRepository.findById(numericId.longValue());
                    
                    if (userOpt.isEmpty()) {
                        System.out.println("User not found with numeric ID: " + numericId);
                        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(Map.of("error", "User not found"));
                    }
                } catch (NumberFormatException e) {
                    System.out.println("Failed to parse ID as numeric: " + id);
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(Map.of("error", "User not found"));
                }
            }
            
            User user = userOpt.get();
            System.out.println("Found user: " + user.getId() + ", " + user.getName() + ", UID: " + user.getUid());
            
            // Get user stats from service with error handling
            Map<String, Object> dashboardData;
            try {
                dashboardData = userService.getUserDashboardData(user.getId().toString());
            } catch (Exception e) {
                System.out.println("Error getting dashboard data: " + e.getMessage());
                e.printStackTrace();
                // Create empty dashboard data if service call fails
                dashboardData = new HashMap<>();
            }
            
            // Add user profile data
            Map<String, Object> profileData = new HashMap<>();
            profileData.put("id", user.getUid() != null ? user.getUid() : user.getId().toString());
            profileData.put("name", user.getName());
            profileData.put("email", user.getEmail());
            profileData.put("phone", user.getPhone());
            profileData.put("address", user.getAddress());
            profileData.put("avatar", user.getAvatar());
            profileData.put("memberSince", user.getCreatedAt());
            profileData.put("role", user.getRole().toString());
            
            dashboardData.put("profile", profileData);
            
            return ResponseEntity.ok(dashboardData);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch dashboard data: " + e.getMessage()));
        }
    }
}