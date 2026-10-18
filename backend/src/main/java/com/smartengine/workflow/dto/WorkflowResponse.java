package com.smartengine.workflow.dto;

import com.smartengine.workflow.entity.WorkflowStatut;
import java.time.LocalDateTime;
import java.util.List;

public record WorkflowResponse(
    Long id,
    String name,
    String description,
    WorkflowStatut status,
    LocalDateTime dateCreation,
    List<WorkflowNodeDto> nodes,
    List<WorkflowEdgeDto> edges,
    int nodeCount
) {}
