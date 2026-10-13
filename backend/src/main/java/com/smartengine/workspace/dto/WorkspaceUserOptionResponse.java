package com.smartengine.workspace.dto;

public record WorkspaceUserOptionResponse(
    Long id,
    String name,
    String email,
    Boolean active,
    String avatar
) {
}
