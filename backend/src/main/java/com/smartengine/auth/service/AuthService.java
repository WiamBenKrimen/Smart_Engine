package com.smartengine.auth.service;

import com.smartengine.auth.dto.ChangePasswordRequest;
import com.smartengine.auth.dto.ForgotPasswordRequest;
import com.smartengine.auth.dto.ForgotPasswordResponse;
import com.smartengine.auth.dto.LoginRequest;
import com.smartengine.auth.dto.LoginResponse;
import com.smartengine.auth.dto.ResetPasswordRequest;
import com.smartengine.security.JwtService;
import com.smartengine.user.dto.UserResponse;
import com.smartengine.user.entity.Utilisateur;
import com.smartengine.user.repository.UtilisateurRepository;
import com.smartengine.workspace.repository.MembreEspaceRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.security.SecureRandom;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String TEMP_PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

    private final UtilisateurRepository utilisateurRepository;
    private final MembreEspaceRepository membreEspaceRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        Utilisateur user = utilisateurRepository.findByEmail(request.email().toLowerCase())
            .orElseThrow(() -> new BadCredentialsException("Email ou mot de passe incorrect."));

        if (!Boolean.TRUE.equals(user.getActif()) || !passwordEncoder.matches(request.motDePasse(), user.getMotDePasse())) {
            throw new BadCredentialsException("Email ou mot de passe incorrect.");
        }

        String token = jwtService.generateToken(user.getEmail());
        return new LoginResponse(token, toResponse(user));
    }

    @Transactional(readOnly = true)
    public UserResponse currentUser(String email) {
        Utilisateur user = utilisateurRepository.findByEmail(email)
            .orElseThrow(() -> new BadCredentialsException("Utilisateur introuvable."));
        return toResponse(user);
    }

    @Transactional
    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request) {
        String genericMessage = "Si ce compte existe, un mot de passe temporaire a ete envoye.";
        return utilisateurRepository.findByEmail(request.email().toLowerCase())
            .map(user -> {
                String temporaryPassword = generateTemporaryPassword();
                user.setMotDePasse(passwordEncoder.encode(temporaryPassword));
                user.setResetPasswordToken(null);
                user.setResetPasswordExpiresAt(null);
                emailService.sendTemporaryPasswordEmail(
                    user.getEmail(),
                    user.getPrenom(),
                    temporaryPassword
                );
                return new ForgotPasswordResponse(genericMessage);
            })
            .orElseGet(() -> new ForgotPasswordResponse(genericMessage));
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        Utilisateur user = utilisateurRepository.findByResetPasswordToken(request.token())
            .orElseThrow(() -> new BadCredentialsException("Lien de reinitialisation invalide."));

        if (user.getResetPasswordExpiresAt() == null || user.getResetPasswordExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadCredentialsException("Lien de reinitialisation expire.");
        }

        user.setMotDePasse(passwordEncoder.encode(request.newPassword()));
        user.setResetPasswordToken(null);
        user.setResetPasswordExpiresAt(null);
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        Utilisateur user = utilisateurRepository.findByEmail(email)
            .orElseThrow(() -> new BadCredentialsException("Utilisateur introuvable."));

        if (!passwordEncoder.matches(request.currentPassword(), user.getMotDePasse())) {
            throw new BadCredentialsException("Mot de passe actuel incorrect.");
        }

        user.setMotDePasse(passwordEncoder.encode(request.newPassword()));
        user.setResetPasswordToken(null);
        user.setResetPasswordExpiresAt(null);
    }

    private String generateTemporaryPassword() {
        SecureRandom random = new SecureRandom();
        StringBuilder password = new StringBuilder();
        for (int i = 0; i < 12; i++) {
            password.append(TEMP_PASSWORD_CHARS.charAt(random.nextInt(TEMP_PASSWORD_CHARS.length())));
        }
        return password.toString();
    }

    private UserResponse toResponse(Utilisateur user) {
        List<String> workspaceIds = membreEspaceRepository.findByUtilisateur_Id(user.getId())
            .stream()
            .map(membre -> "ws" + membre.getEspace().getId())
            .toList();
        String role = Boolean.TRUE.equals(user.getEstAdmin()) ? "ADMIN" : "EMPLOYEE";
        String name = user.getPrenom() + " " + user.getNom();
        String avatar = (firstLetter(user.getPrenom()) + firstLetter(user.getNom())).toUpperCase();

        return new UserResponse(
            user.getId(),
            name,
            user.getPrenom(),
            user.getNom(),
            user.getEmail(),
            role,
            workspaceIds,
            user.getActif(),
            avatar
        );
    }

    private String firstLetter(String value) {
        return value == null || value.isBlank() ? "" : value.substring(0, 1);
    }
}
