package com.evenza.backend.DTO;

import lombok.Getter;

@Getter
public class FirebaseLoginResponse {
    private  String email;
    private String name;
    private String uid;

    private UserDTO user; // Add this field

    public FirebaseLoginResponse(String email, String name, String uid) {
        this.email = email;
        this.name = name;
        this.uid = uid;
        this.user = new UserDTO();
    }

}
