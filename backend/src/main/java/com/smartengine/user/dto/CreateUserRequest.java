package com.smartengine.user.dto;

public record CreateUserRequest(
    String prenom,
    String nom,
    String email,
    String motDePasse,
    Boolean estAdmin
) {
}
