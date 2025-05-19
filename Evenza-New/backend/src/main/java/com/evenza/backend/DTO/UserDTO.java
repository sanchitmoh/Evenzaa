package com.evenza.backend.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserDTO {

        private String email;
        private String name;
        private String uid;
    @Setter
    private Integer id;
    @Setter
    private String role;


    public UserDTO() {
        this.email = email;
        this.name = name;
        this.uid = uid;
    }


}
