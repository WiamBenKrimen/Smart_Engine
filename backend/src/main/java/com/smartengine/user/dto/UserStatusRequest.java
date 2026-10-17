package com.smartengine.user.dto;

import com.fasterxml.jackson.annotation.JsonAlias;

public record UserStatusRequest(
    @JsonAlias({"actif", "active"})
    Boolean active
) {
}
