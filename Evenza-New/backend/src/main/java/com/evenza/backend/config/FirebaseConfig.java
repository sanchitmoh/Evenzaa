package com.evenza.backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.ByteArrayInputStream;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {
    private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);

    @Value("${firebase.config:}")
    private String firebaseConfig;

    @PostConstruct
    public void init() {
        try {
            InputStream serviceAccount;
            
            // Try environment variable first (for Railway/cloud deployment)
            if (firebaseConfig != null && !firebaseConfig.isEmpty()) {
                logger.info("Initializing Firebase from environment variable");
                serviceAccount = new ByteArrayInputStream(firebaseConfig.getBytes());
            } else {
                // Fallback to local file (for local development)
                logger.info("Initializing Firebase from service account file");
                serviceAccount = new ClassPathResource("firebase-service-account.json").getInputStream();
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
            }

            logger.info("✅ Firebase has been initialized.");
        } catch (Exception e) {
            logger.error("🔥 Failed to initialize Firebase", e);
            throw new RuntimeException("🔥 Failed to initialize Firebase", e);
        }
    }
}

