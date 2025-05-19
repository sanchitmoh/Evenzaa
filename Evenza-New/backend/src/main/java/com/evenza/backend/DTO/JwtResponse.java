package com.evenza.backend.DTO;


import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class JwtResponse {
    private String token;
    private String refreshToken;
    private String type = "Bearer";
    private Integer id;
    private String name;
    private String email;
    private String role;

    public JwtResponse(String token, String refreshToken, Integer id, String name, String email, String role) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;


    }

}

