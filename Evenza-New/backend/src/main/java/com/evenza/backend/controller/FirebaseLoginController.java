package com.evenza.backend.controller;

import com.evenza.backend.DTO.FirebaseLoginRequest;
import com.evenza.backend.DTO.UserDTO;
import com.evenza.backend.DTO.FirebaseLoginResponse;
import com.evenza.backend.model.User;
import com.evenza.backend.security.Jwt.JwtUtils;
import com.evenza.backend.services.FirebaseService;
import com.evenza.backend.services.UserService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

@RestController
@RequestMapping("/api/auth")
public class FirebaseLoginController {
    private static final Logger logger = LoggerFactory.getLogger(FirebaseLoginController.class);
    
    private final FirebaseService firebaseService;
    private final UserService userService;
    private final JwtUtils jwtUtils;

    @Autowired
    public FirebaseLoginController(
            FirebaseService firebaseService,
            UserService userService,
            JwtUtils jwtUtils) {
        this.firebaseService = firebaseService;
        this.userService = userService;
        this.jwtUtils = jwtUtils;
    }

    @PostMapping("/firebase-login")
    public ResponseEntity<?> firebaseLogin(@Valid @RequestBody FirebaseLoginRequest request) {
        logger.info("Received firebase-login request");
        
        try {
            String token = request.getToken();
            if (token == null || token.isEmpty()) {
                logger.error("Firebase login failed: Token is null or empty");
                return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "Token is required"
                ));
            }
            
            logger.info("Firebase login attempt with token length: {}", token.length());
            
            try {
                // Authenticate with Firebase
                User user = firebaseService.authenticateFirebaseToken(token);
                
                if (user == null) {
                    logger.error("Firebase authentication failed: null user returned");
                    return ResponseEntity.badRequest().body(Map.of(
                            "status", "error",
                            "message", "Firebase authentication failed"
                    ));
                }
                
                // Generate JWT tokens
                String jwt = jwtUtils.generateJwtToken(user);
                String refreshToken = jwtUtils.generateRefreshToken(user);
                
                logger.info("Firebase login successful for user: {}", user.getEmail());
                
                // Create a UserDTO instead of using the User entity directly
                UserDTO userDTO = new UserDTO();
                userDTO.setId(user.getId());
                userDTO.setName(user.getName());
                userDTO.setEmail(user.getEmail());
                userDTO.setRole(user.getRole().toString());
                userDTO.setUid(user.getUid());
                
                // Build response using simple types and the DTO
                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("message", "Firebase login successful");
                response.put("token", jwt);
                response.put("refreshToken", refreshToken); // Always include refresh token
                response.put("user", userDTO);
                
                return ResponseEntity.ok(response);
            } catch (Exception e) {
                logger.error("Firebase authentication error: {}", e.getMessage(), e);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                        "status", "error",
                        "message", "Firebase authentication failed: " + e.getMessage()
                ));
            }
        } catch (Exception e) {
            logger.error("Firebase login error: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "Firebase login failed: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/firebase-login-debug")
    public ResponseEntity<?> firebaseLoginDebug(@RequestBody String rawJson) {
        logger.info("Received raw JSON: {}", rawJson);
        
        try {
            // Parse the raw JSON to see what's being received
            ObjectMapper mapper = new ObjectMapper();
            JsonNode jsonNode = mapper.readTree(rawJson);
            
            // Log the structure
            logger.info("JSON structure: {}", jsonNode.toString());
            
            // Check if token exists
            if (jsonNode.has("token")) {
                String token = jsonNode.get("token").asText();
                logger.info("Found token with length: {}", token.length());
                
                // Create a proper request object
                FirebaseLoginRequest request = new FirebaseLoginRequest(token);
                
                // Process normally
                return firebaseLogin(request);
            } else {
                logger.error("No token field found in JSON");
                return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "No token field found in request"
                ));
            }
        } catch (Exception e) {
            logger.error("Error parsing debug JSON: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "message", "Error parsing request: " + e.getMessage()
            ));
        }
    }
}

