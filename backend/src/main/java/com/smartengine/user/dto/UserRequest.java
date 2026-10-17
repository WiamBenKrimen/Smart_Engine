package com.smartengine.user.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record UserRequest(
    @JsonAlias({"name", "nomComplet"})
    String name,

    String prenom,
    String nom,

    @NotBlank(message = "L'adresse email est obligatoire")
    @Email(message = "Format d'adresse email invalide")
    String email,

    @JsonAlias({"motDePasse", "tempPassword", "temporaryPassword"})
    String password,

    @JsonAlias({"role", "roleSysteme"})
    String role,

    @JsonAlias({"estAdmin", "isAdmin"})
    Boolean estAdmin,

    @JsonAlias({"workspaceIds", "espaces"})
    List<String> workspaceIds,

    @JsonAlias({"active", "actif"})
    Boolean active
) {
}
