package com.smartengine.workflow.dto;

import java.util.List;

public record WorkflowValidationResult(
    boolean valid,
    List<String> errors,
    List<String> warnings
) {}
