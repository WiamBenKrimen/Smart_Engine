package com.smartengine.request.dto;

import jakarta.validation.constraints.NotNull;

public record DemandeRequest(
    @NotNull Long processusId,
    @NotNull String dataJson
) {}
