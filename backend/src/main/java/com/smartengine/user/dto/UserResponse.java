package com.smartengine.user.dto;

import java.util.List;

public record UserResponse(
    Long id,
    String name,
    String prenom,
    String nom,
    String email,
    String role,
    List<String> workspaceIds,
    Boolean active,
    String avatar
) {
}
