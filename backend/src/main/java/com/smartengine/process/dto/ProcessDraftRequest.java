package com.smartengine.process.dto;
import com.smartengine.formbuilder.entity.TypeChamp;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;
public record ProcessDraftRequest(
    @NotBlank @Size(max=150) String name,
    @Size(max=500) String description,
    @Size(max=30) String icon,
    @NotNull @Size(max=100) List<@NotBlank String> workspaceIds,
    @NotNull @Pattern(regexp="new|reuse") String formMode,
    String formRefId,
    @NotNull @Size(max=200) List<@Valid Field> formFields,
    @Min(1) @Max(3) int savedStep
) {
    public record Field(
        String id,
        @NotNull TypeChamp type,
        @NotBlank @Size(max=100) @Pattern(regexp="[a-zA-Z][a-zA-Z0-9_]*") String key,
        @NotBlank @Size(max=150) String label,
        boolean required,
        @Size(max=500) String placeholder,
        @Size(max=1000) String helpText,
        @Size(max=100) List<@NotBlank @Size(max=200) String> options,
        int order
    ) {}
}
