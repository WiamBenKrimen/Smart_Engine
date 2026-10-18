package com.smartengine.process.dto;

import com.smartengine.process.dto.ProcessDraftRequest.Field;
import com.smartengine.workflow.dto.WorkflowEdgeDto;
import com.smartengine.workflow.dto.WorkflowNodeDto;
import com.smartengine.workflow.entity.WorkflowStatut;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record ProcessCreateRequest(
    @NotBlank @Size(max = 150) String name,
    @Size(max = 500) String description,
    @Size(max = 30) String icon,
    List<String> workspaceIds,
    @NotNull String formMode, // "new" or "reuse"
    String formRefId,
    List<Field> formFields,
    Long formId,
    String wfMode, // "new" or "reuse"
    String wfRefId,
    List<WorkflowNodeDto> wfNodes,
    List<WorkflowEdgeDto> wfEdges,
    Long workflowId,
    WorkflowStatut status,
    Long draftId
) {}
