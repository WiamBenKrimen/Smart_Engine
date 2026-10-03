package com.smartengine.auth.dto;

import com.smartengine.user.dto.UserResponse;

public record LoginResponse(String token, UserResponse user) {
}
