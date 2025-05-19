package com.evenza.backend.DTO;


import jakarta.validation.constraints.NotBlank;

import lombok.Getter;

import lombok.Setter;

@Setter
@Getter

public class FirebaseLoginRequest {
    @NotBlank(message = "Token is required")
    private String token;

    public FirebaseLoginRequest(String token) {
        this.token = token;

    }

    public FirebaseLoginRequest() {
    } // Default constructor for deserialization
}


