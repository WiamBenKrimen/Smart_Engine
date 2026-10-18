package com.smartengine.workflow.dto;

import com.smartengine.workflow.entity.WorkflowStatut;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record WorkflowRequest(
    @NotBlank @Size(max = 150) String name,
    @Size(max = 500) String description,
    WorkflowStatut status,
    List<WorkflowNodeDto> nodes,
    List<WorkflowEdgeDto> edges
) {}
