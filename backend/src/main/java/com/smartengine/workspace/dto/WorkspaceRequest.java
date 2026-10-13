package com.smartengine.workspace.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record WorkspaceRequest(
    @NotBlank @Size(max = 150) String name,
    @NotBlank @Size(max = 80) String code,
    @Size(max = 500) String description,
    Boolean active
) {
}
