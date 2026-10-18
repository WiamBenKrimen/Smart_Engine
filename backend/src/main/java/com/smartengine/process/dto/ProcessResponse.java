package com.smartengine.process.dto;

import com.smartengine.workflow.entity.WorkflowStatut;
import java.time.LocalDateTime;
import java.util.List;

public record ProcessResponse(
    Long id,
    String name,
    String description,
    String icon,
    WorkflowStatut status,
    LocalDateTime dateCreation,
    Long formId,
    String formName,
    Long workflowId,
    String workflowName,
    List<String> workspaceIds,
    int fieldCount,
    int nodeCount
) {}
