package com.smartengine.workflow.dto;

import com.smartengine.workflow.entity.TypeNoeud;
import java.math.BigDecimal;

public record WorkflowNodeDto(
    String id,
    TypeNoeud type,
    String label,
    BigDecimal x,
    BigDecimal y,
    String workspaceId,
    Integer slaHours,
    String conditionField,
    String conditionOperator,
    String conditionValue,
    String endResult,
    String assignedUserId
) {}
