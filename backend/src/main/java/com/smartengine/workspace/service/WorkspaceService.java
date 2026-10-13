package com.smartengine.workspace.service;

import com.smartengine.user.entity.Utilisateur;
import com.smartengine.user.repository.UtilisateurRepository;
import com.smartengine.workspace.dto.WorkspaceMemberRequest;
import com.smartengine.workspace.dto.WorkspaceRequest;
import com.smartengine.workspace.dto.WorkspaceResponse;
import com.smartengine.workspace.dto.WorkspaceStatusRequest;
import com.smartengine.workspace.dto.WorkspaceUserOptionResponse;
import com.smartengine.workspace.entity.Espace;
import com.smartengine.workspace.entity.MembreEspace;
import com.smartengine.workspace.entity.MembreEspaceId;
import com.smartengine.workspace.repository.EspaceRepository;
import com.smartengine.workspace.repository.MembreEspaceRepository;
import jakarta.persistence.EntityNotFoundException;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WorkspaceService {

    private final EspaceRepository espaceRepository;
    private final MembreEspaceRepository membreEspaceRepository;
    private final UtilisateurRepository utilisateurRepository;

    @Transactional(readOnly = true)
    public List<WorkspaceResponse> list() {
        return espaceRepository.findAll()
            .stream()
            .sorted(Comparator.comparing(Espace::getNom, String.CASE_INSENSITIVE_ORDER))
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public WorkspaceResponse getById(String id) {
        return toResponse(findEspace(id));
    }

    @Transactional(readOnly = true)
    public List<WorkspaceUserOptionResponse> listUsersForMembers() {
        return utilisateurRepository.findAll()
            .stream()
            .sorted(Comparator.comparing(Utilisateur::getNom, String.CASE_INSENSITIVE_ORDER)
                .thenComparing(Utilisateur::getPrenom, String.CASE_INSENSITIVE_ORDER))
            .map(this::toUserOption)
            .toList();
    }

    @Transactional
    public WorkspaceResponse create(WorkspaceRequest request) {
        String code = normalizeCode(request.code());
        espaceRepository.findByCode(code).ifPresent(existing -> {
            throw new IllegalArgumentException("Un workspace avec ce code existe deja.");
        });

        Espace espace = new Espace();
        applyRequest(espace, request);
        espace.setActif(request.active() == null || request.active());
        return toResponse(espaceRepository.save(espace));
    }

    @Transactional
    public WorkspaceResponse update(String id, WorkspaceRequest request) {
        Espace espace = findEspace(id);
        String code = normalizeCode(request.code());
        espaceRepository.findByCode(code)
            .filter(existing -> !existing.getId().equals(espace.getId()))
            .ifPresent(existing -> {
                throw new IllegalArgumentException("Un workspace avec ce code existe deja.");
            });

        applyRequest(espace, request);
        if (request.active() != null) {
            espace.setActif(request.active());
        }
        return toResponse(espace);
    }

    @Transactional
    public WorkspaceResponse updateStatus(String id, WorkspaceStatusRequest request) {
        Espace espace = findEspace(id);
        espace.setActif(request.active());
        return toResponse(espace);
    }

    @Transactional
    public WorkspaceResponse addMember(String id, WorkspaceMemberRequest request) {
        Espace espace = findEspace(id);
        Utilisateur utilisateur = utilisateurRepository.findById(request.userId())
            .orElseThrow(() -> new EntityNotFoundException("Utilisateur introuvable."));

        MembreEspaceId memberId = new MembreEspaceId();
        memberId.setEspaceId(espace.getId());
        memberId.setUtilisateurId(utilisateur.getId());

        if (!membreEspaceRepository.existsById(memberId)) {
            MembreEspace membre = new MembreEspace();
            membre.setId(memberId);
            membre.setEspace(espace);
            membre.setUtilisateur(utilisateur);
            membreEspaceRepository.save(membre);
        }

        return toResponse(espace);
    }

    @Transactional
    public WorkspaceResponse removeMember(String id, Long userId) {
        Espace espace = findEspace(id);
        membreEspaceRepository.deleteByEspace_IdAndUtilisateur_Id(espace.getId(), userId);
        return toResponse(espace);
    }

    private void applyRequest(Espace espace, WorkspaceRequest request) {
        espace.setNom(request.name().trim());
        espace.setCode(normalizeCode(request.code()));
        espace.setDescription(request.description() == null ? null : request.description().trim());
    }

    private Espace findEspace(String id) {
        return espaceRepository.findById(parseWorkspaceId(id))
            .orElseThrow(() -> new EntityNotFoundException("Workspace introuvable."));
    }

    private Long parseWorkspaceId(String id) {
        String normalized = id == null ? "" : id.trim().toLowerCase();
        if (normalized.startsWith("ws")) {
            normalized = normalized.substring(2);
        }
        return Long.parseLong(normalized);
    }

    private String normalizeCode(String code) {
        return code.trim().toUpperCase();
    }

    private WorkspaceResponse toResponse(Espace espace) {
        List<Long> memberIds = membreEspaceRepository.findByEspace_Id(espace.getId())
            .stream()
            .map(membre -> membre.getUtilisateur().getId())
            .toList();

        return new WorkspaceResponse(
            "ws" + espace.getId(),
            espace.getId(),
            espace.getNom(),
            espace.getCode(),
            espace.getDescription(),
            espace.getActif(),
            memberIds,
            memberIds.size()
        );
    }

    private WorkspaceUserOptionResponse toUserOption(Utilisateur user) {
        String name = user.getPrenom() + " " + user.getNom();
        String avatar = (firstLetter(user.getPrenom()) + firstLetter(user.getNom())).toUpperCase();
        return new WorkspaceUserOptionResponse(user.getId(), name, user.getEmail(), user.getActif(), avatar);
    }

    private String firstLetter(String value) {
        return value == null || value.isBlank() ? "" : value.substring(0, 1);
    }
}
