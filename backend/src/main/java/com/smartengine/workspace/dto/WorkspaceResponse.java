package com.smartengine.workspace.dto;

import java.util.List;

public record WorkspaceResponse(
    String id,
    Long dbId,
    String name,
    String code,
    String description,
    Boolean active,
    List<Long> memberIds,
    Integer memberCount
) {
}
