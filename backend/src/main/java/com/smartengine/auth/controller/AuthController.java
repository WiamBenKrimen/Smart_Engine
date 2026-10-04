package com.smartengine.auth.controller;

import com.smartengine.auth.dto.ChangePasswordRequest;
import com.smartengine.auth.dto.ForgotPasswordRequest;
import com.smartengine.auth.dto.ForgotPasswordResponse;
import com.smartengine.auth.dto.LoginRequest;
import com.smartengine.auth.dto.LoginResponse;
import com.smartengine.auth.dto.MessageResponse;
import com.smartengine.auth.dto.ResetPasswordRequest;
import com.smartengine.auth.service.AuthService;
import com.smartengine.user.dto.UserResponse;
import jakarta.validation.Valid;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> currentUser(Principal principal) {
        return ResponseEntity.ok(authService.currentUser(principal.getName()));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ForgotPasswordResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.forgotPassword(request));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(new MessageResponse("Mot de passe modifie avec succes."));
    }

    @PostMapping("/change-password")
    public ResponseEntity<MessageResponse> changePassword(
        Principal principal,
        @Valid @RequestBody ChangePasswordRequest request
    ) {
        authService.changePassword(principal.getName(), request);
        return ResponseEntity.ok(new MessageResponse("Mot de passe modifie avec succes."));
    }
}
