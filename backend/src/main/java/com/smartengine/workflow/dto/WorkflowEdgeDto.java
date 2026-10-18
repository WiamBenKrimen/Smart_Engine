package com.smartengine.workflow.dto;

public record WorkflowEdgeDto(
    String id,
    String from,
    String to,
    String label
) {}
