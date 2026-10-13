package com.smartengine.workspace.dto;

import jakarta.validation.constraints.NotNull;

public record WorkspaceStatusRequest(
    @NotNull Boolean active
) {
}
