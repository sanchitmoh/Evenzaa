package com.evenza.backend.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.evenza.backend.DTO.LoginRequest;
import com.evenza.backend.DTO.MessageResponse;
import com.evenza.backend.DTO.SignupRequest;
import com.evenza.backend.DTO.TokenRefreshRequest;
import com.evenza.backend.DTO.TokenRefreshResponse;
import com.evenza.backend.model.User;
import com.evenza.backend.security.Jwt.JwtUtils;
import com.evenza.backend.services.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"}, maxAge = 3600)
public class AuthController {
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    
    // Hardcoded admin credentials
    private static final String ADMIN_EMAIL = "admin1@gmail.com";
    private static final String ADMIN_PASSWORD = "admin1@123";
    private static final Integer ADMIN_ID = 999;
    
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserService userService;

    @Autowired
    JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            logger.info("Login attempt for user: {}", loginRequest.getEmail());
            
            // Check for hardcoded admin credentials
            if (ADMIN_EMAIL.equals(loginRequest.getEmail()) && ADMIN_PASSWORD.equals(loginRequest.getPassword())) {
                logger.info("Admin login successful using hardcoded credentials");
                
                // Create a special admin token without database validation
                String jwt = jwtUtils.generateTokenFromUsername(ADMIN_EMAIL, ADMIN_ID, "ADMIN");
                String refreshToken = jwtUtils.generateRefreshToken(createAdminUser());
                
                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("message", "Admin login successful");
                response.put("token", jwt);
                response.put("refreshToken", refreshToken);
                response.put("id", ADMIN_ID);
                response.put("name", "Admin User");
                response.put("email", ADMIN_EMAIL);
                response.put("role", "ADMIN");
                
                return ResponseEntity.ok(response);
            }

            // Regular authentication process for non-admin users
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);

            Optional<User> userOpt = userService.findByEmail(loginRequest.getEmail());
            if (userOpt.isEmpty()) {
                logger.warn("Login failed: User not found with email: {}", loginRequest.getEmail());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new MessageResponse("User not found"));
            }

            User user = userOpt.get();
            String jwt = jwtUtils.generateJwtToken(user);
            String refreshToken = jwtUtils.generateRefreshToken(user);
            logger.info("Login successful for user: {}", user.getEmail());
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Login successful");
            response.put("token", jwt);
            response.put("refreshToken", refreshToken);
            response.put("id", user.getId());
            response.put("name", user.getName());
            response.put("email", user.getEmail());
            response.put("role", user.getRole().toString());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Login failed for user: {}, reason: {}", loginRequest.getEmail(), e.getMessage());

            Map<String, Object> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", "Login failed: Invalid email or password");
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponse("Invalid email or password"));
        }
    }
    
    // Helper method to create a temporary admin user object
    private User createAdminUser() {
        User adminUser = new User();
        adminUser.setId(ADMIN_ID);
        adminUser.setEmail(ADMIN_EMAIL);
        adminUser.setName("Admin User");
        adminUser.setRole(User.Role.ADMIN);
        adminUser.setUid("admin-" + UUID.randomUUID());
        return adminUser;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        try {
            logger.info("Registration attempt for email: {}", signUpRequest.getEmail());
            
            // Prevent registration with admin email
            if (ADMIN_EMAIL.equals(signUpRequest.getEmail())) {
                logger.warn("Registration attempt with reserved admin email: {}", signUpRequest.getEmail());
                
                Map<String, Object> response = new HashMap<>();
                response.put("status", "error");
                response.put("message", "Registration failed: This email is reserved");
                
                return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
            }

            // Check if email exists
            if (userService.existsByEmail(signUpRequest.getEmail())) {
                logger.warn("Registration failed: Email already in use: {}", signUpRequest.getEmail());

                Map<String, Object> response = new HashMap<>();
                response.put("status", "error");
                response.put("message", "Registration failed: Email is already in use");

                return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
            }

            // Create new user
            User user = new User();
            user.setName(signUpRequest.getName());
            user.setEmail(signUpRequest.getEmail());
            user.setPassword(signUpRequest.getPassword());
            user.setRole(User.Role.USER);

            // Generate a UID for the user if not using Firebase
            if (user.getUid() == null || user.getUid().isEmpty()) {
                user.setUid(UUID.randomUUID().toString());
            }
            // Save user
            User savedUser = userService.registerUser(user);
            logger.info("Registration successful for user: {}", savedUser.getEmail());

            // Generate JWT token for immediate login
            String jwt = jwtUtils.generateJwtToken(savedUser);
            String refreshToken = jwtUtils.generateRefreshToken(savedUser);

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Registration successful");
            response.put("token", jwt);
            response.put("user", Map.of(
                    "id", savedUser.getId(),
                    "uid", savedUser.getUid(),
                    "name", savedUser.getName(),
                    "email", savedUser.getEmail(),
                    "role", savedUser.getRole().toString()
            ));

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            logger.error("Registration failed for email: {}, reason: {}",
                    signUpRequest.getEmail(), e.getMessage());

            Map<String, Object> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", "Registration failed: " + e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@Valid @RequestBody TokenRefreshRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        try {
            if (jwtUtils.validateJwtToken(requestRefreshToken)) {
                String email = jwtUtils.getUsernameFromJwtToken(requestRefreshToken);
                
                // Special handling for admin refresh token
                if (ADMIN_EMAIL.equals(email)) {
                    String newAccessToken = jwtUtils.generateTokenFromUsername(ADMIN_EMAIL, ADMIN_ID, "ADMIN");
                    return ResponseEntity.ok(new TokenRefreshResponse(newAccessToken, requestRefreshToken));
                }
                
                Optional<User> userOpt = userService.findByEmail(email);
                if (userOpt.isEmpty()) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(new MessageResponse("Refresh token is not valid"));
                }
                
                User user = userOpt.get();
                String newAccessToken = jwtUtils.generateJwtToken(user);
                
                return ResponseEntity.ok(new TokenRefreshResponse(newAccessToken, requestRefreshToken));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new MessageResponse("Refresh token is not valid"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponse("Error refreshing token"));
        }
    }


}
