package com.evenza.backend.model;

import java.io.Serial;
import java.io.Serializable;

import com.evenza.backend.Converter.RoleConverter;
import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Entity
@Table(name = "users")
public class User implements Serializable {
    @Serial
    private static final long serialVersionUID = 1L;
    // Getters and Setters
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = true)
    @JsonIgnore
    private String password;

    private String phone;
    
    private String address;
    
    private String avatar;

    // optionally:
    private String provider; // "google", "github", "local"

    @Convert(converter = RoleConverter.class)
    @Column(nullable = false, columnDefinition = "ENUM('user', 'admin') DEFAULT 'user'")
    private Role role = Role.USER;
    
    @Column(unique = true)
    private String uid;
    
    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
        updatedAt = java.time.LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = java.time.LocalDateTime.now();
    }

    public String getProfileImagePublicId() {
        if (avatar != null && !avatar.isEmpty()) {
            String[] parts = avatar.split("/");
            if (parts.length > 0) {
                return parts[parts.length - 1];
            }
        }
        return null;
    }

    public void setProfileImageUrl(String imageUrl) {
        if (imageUrl != null && !imageUrl.isEmpty()) {
            this.avatar = imageUrl;
        }
    }

    public void setProfileImagePublicId(String publicId) {
        if (avatar != null && !avatar.isEmpty()) {
            String[] parts = avatar.split("/");
            if (parts.length > 0) {
                avatar = parts[parts.length - 1];
            }
        }
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phone = phoneNumber;
    }

    // Enum for Role
    public enum Role implements Serializable {
        USER,
        ADMIN
    }
    public String generateCacheKey() {
        if (this.uid != null && !this.uid.isEmpty()) {
            return "USER:" + this.uid;
        } else if (this.id != null) {
            return "USER:" + this.id;
        } else if (this.email != null && !this.email.isEmpty()) {
            return "USER:EMAIL:" + this.email;
        }
        return null;
    }

    // Required for proper deserialization
    @Override
    public String toString() {
        return "User{" +
               "id=" + id +
               ", name='" + name + '\'' +
               ", email='" + email + '\'' +
               ", uid='" + uid + '\'' +
               ", role=" + role +
               '}';
    }
}