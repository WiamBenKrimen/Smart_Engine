package com.smartengine.user.dto;

public record UserResponse(
    Long id,
    String prenom,
    String nom,
    String email,
    Boolean estAdmin,
    Boolean actif
) {
}
