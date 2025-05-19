package com.evenza.backend.security.Jwt;



import java.security.SecureRandom;
import java.util.Base64;

/**
 * Utility class to generate a secure random key for JWT signing.
 * Run this class as a Java application to generate a new key.
 */
public class SecretKeyGenerator {
    public static void main(String[] args) {
        // Create a secure random number generator
        SecureRandom random = new SecureRandom();

        // Generate 64 bytes (512 bits) of random data
        // This is more than sufficient for HS256 which requires at least 256 bits
        byte[] bytes = new byte[64];
        random.nextBytes(bytes);

        // Encode the random bytes as a Base64 string
        String encodedKey = Base64.getEncoder().encodeToString(bytes);

        // Print the generated key
        System.out.println("Generated JWT Secret Key (Base64):");
        System.out.println(encodedKey);
        System.out.println("\nAdd this to your application.properties file:");
        System.out.println("app.jwt.secret=" + encodedKey);
    }
}
