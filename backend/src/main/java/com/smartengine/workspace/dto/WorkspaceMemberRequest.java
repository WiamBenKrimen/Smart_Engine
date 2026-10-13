package com.smartengine.workspace.dto;

import jakarta.validation.constraints.NotNull;

public record WorkspaceMemberRequest(
    @NotNull Long userId
) {
}
