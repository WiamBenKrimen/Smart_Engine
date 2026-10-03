package com.smartengine.auth.service;

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
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UtilisateurRepository utilisateurRepository;
    private final MembreEspaceRepository membreEspaceRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

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
        String genericMessage = "Si ce compte existe, un lien de reinitialisation a ete prepare.";
        return utilisateurRepository.findByEmail(request.email().toLowerCase())
            .map(user -> {
                String token = UUID.randomUUID().toString();
                user.setResetPasswordToken(token);
                user.setResetPasswordExpiresAt(LocalDateTime.now().plusMinutes(30));
                return new ForgotPasswordResponse(genericMessage, token);
            })
            .orElseGet(() -> new ForgotPasswordResponse(genericMessage, null));
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
