package com.smartengine.process.dto;

import java.util.List;

public record ProcessValidationResult(
    boolean valid,
    List<String> errors,
    List<String> warnings
) {}
