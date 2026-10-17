package com.smartengine.user.service;

import com.smartengine.user.dto.UserRequest;
import com.smartengine.user.dto.UserResponse;
import com.smartengine.user.dto.UserStatusRequest;
import com.smartengine.user.entity.Utilisateur;
import com.smartengine.user.repository.UtilisateurRepository;
import com.smartengine.workspace.entity.Espace;
import com.smartengine.workspace.entity.MembreEspace;
import com.smartengine.workspace.entity.MembreEspaceId;
import com.smartengine.workspace.repository.EspaceRepository;
import com.smartengine.workspace.repository.MembreEspaceRepository;
import jakarta.persistence.EntityNotFoundException;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UtilisateurRepository utilisateurRepository;
    private final MembreEspaceRepository membreEspaceRepository;
    private final EspaceRepository espaceRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return utilisateurRepository.findAll().stream()
            .sorted(Comparator.comparing(Utilisateur::getNom, String.CASE_INSENSITIVE_ORDER)
                .thenComparing(Utilisateur::getPrenom, String.CASE_INSENSITIVE_ORDER))
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        Utilisateur user = utilisateurRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Utilisateur introuvable avec l'ID : " + id));
        return toResponse(user);
    }

    @Transactional
    public UserResponse create(UserRequest request) {
        String email = normalizeEmail(request.email());
        if (utilisateurRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Un utilisateur avec l'adresse email '" + email + "' existe déjà.");
        }

        String[] names = extractNames(request);
        String prenom = names[0];
        String nom = names[1];

        String rawPassword = request.password();
        if (rawPassword == null || rawPassword.isBlank()) {
            rawPassword = "User123!";
        }

        boolean isAdmin = isRoleAdmin(request);

        Utilisateur user = new Utilisateur();
        user.setPrenom(prenom);
        user.setNom(nom);
        user.setEmail(email);
        user.setMotDePasse(passwordEncoder.encode(rawPassword.trim()));
        user.setEstAdmin(isAdmin);
        user.setActif(request.active() == null || request.active());

        Utilisateur saved = utilisateurRepository.save(user);

        syncWorkspaces(saved, request.workspaceIds());

        return toResponse(saved);
    }

    @Transactional
    public UserResponse update(Long id, UserRequest request) {
        Utilisateur user = utilisateurRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Utilisateur introuvable avec l'ID : " + id));

        String email = normalizeEmail(request.email());
        if (utilisateurRepository.existsByEmailAndIdNot(email, id)) {
            throw new IllegalArgumentException("Un autre utilisateur utilise déjà l'adresse email '" + email + "'.");
        }

        String[] names = extractNames(request);
        user.setPrenom(names[0]);
        user.setNom(names[1]);
        user.setEmail(email);

        if (request.role() != null || request.estAdmin() != null) {
            user.setEstAdmin(isRoleAdmin(request));
        }

        if (request.password() != null && !request.password().isBlank()) {
            user.setMotDePasse(passwordEncoder.encode(request.password().trim()));
        }

        if (request.active() != null) {
            user.setActif(request.active());
        }

        Utilisateur updated = utilisateurRepository.save(user);

        if (request.workspaceIds() != null) {
            syncWorkspaces(updated, request.workspaceIds());
        }

        return toResponse(updated);
    }

    @Transactional
    public UserResponse updateStatus(Long id, UserStatusRequest request) {
        Utilisateur user = utilisateurRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Utilisateur introuvable avec l'ID : " + id));

        if (request != null && request.active() != null) {
            user.setActif(request.active());
        } else {
            user.setActif(!Boolean.TRUE.equals(user.getActif()));
        }

        Utilisateur updated = utilisateurRepository.save(user);
        return toResponse(updated);
    }

    @Transactional
    public void delete(Long id) {
        Utilisateur user = utilisateurRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Utilisateur introuvable avec l'ID : " + id));

        membreEspaceRepository.deleteByUtilisateur_Id(user.getId());
        utilisateurRepository.delete(user);
    }

    private void syncWorkspaces(Utilisateur user, List<String> workspaceIds) {
        membreEspaceRepository.deleteByUtilisateur_Id(user.getId());

        if (workspaceIds == null || workspaceIds.isEmpty()) {
            return;
        }

        for (String wsIdStr : workspaceIds) {
            Long espaceId = parseWorkspaceId(wsIdStr);
            if (espaceId == null) continue;

            espaceRepository.findById(espaceId).ifPresent(espace -> {
                MembreEspace membre = new MembreEspace();
                MembreEspaceId id = new MembreEspaceId();
                id.setEspaceId(espace.getId());
                id.setUtilisateurId(user.getId());
                membre.setId(id);
                membre.setEspace(espace);
                membre.setUtilisateur(user);
                membreEspaceRepository.save(membre);
            });
        }
    }

    private Long parseWorkspaceId(String idStr) {
        if (idStr == null || idStr.isBlank()) return null;
        String clean = idStr.trim().toLowerCase();
        if (clean.startsWith("ws_")) {
            clean = clean.substring(3);
        } else if (clean.startsWith("ws")) {
            clean = clean.substring(2);
        }
        try {
            return Long.parseLong(clean);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private boolean isRoleAdmin(UserRequest request) {
        if (Boolean.TRUE.equals(request.estAdmin())) return true;
        return "ADMIN".equalsIgnoreCase(request.role());
    }

    private String[] extractNames(UserRequest request) {
        String prenom = request.prenom();
        String nom = request.nom();

        if ((prenom == null || prenom.isBlank()) && (nom == null || nom.isBlank()) && request.name() != null) {
            String fullName = request.name().trim();
            String[] parts = fullName.split("\\s+", 2);
            prenom = parts[0];
            nom = parts.length > 1 ? parts[1] : parts[0];
        }

        prenom = prenom != null && !prenom.isBlank() ? prenom.trim() : "Utilisateur";
        nom = nom != null && !nom.isBlank() ? nom.trim() : "SmartEngine";

        return new String[]{prenom, nom};
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("L'adresse email est obligatoire.");
        }
        return email.trim().toLowerCase();
    }

    private UserResponse toResponse(Utilisateur user) {
        List<String> workspaceIds = membreEspaceRepository.findByUtilisateur_Id(user.getId())
            .stream()
            .map(m -> "ws" + m.getEspace().getId())
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
            avatar,
            user.getDateCreation()
        );
    }

    private String firstLetter(String value) {
        return value == null || value.isBlank() ? "" : value.substring(0, 1);
    }
}
