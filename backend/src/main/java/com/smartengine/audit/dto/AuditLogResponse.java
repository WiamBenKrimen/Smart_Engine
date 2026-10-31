package com.smartengine.audit.dto;

import com.smartengine.audit.entity.Historique;
import java.time.LocalDateTime;

public record AuditLogResponse(
    Long id,
    String action,
    String details,
    LocalDateTime timestamp,
    Long userId,
    String userName,
    String userEmail,
    String resource,
    String resourceId,
    Long demandeId,
    String demandeReference,
    Long workspaceId,
    String workspaceName,
    Long taskId
) {
    public static AuditLogResponse from(Historique h) {
        Long uId = h.getUtilisateur() != null ? h.getUtilisateur().getId() : null;
        String uName = h.getUtilisateur() != null
                ? (h.getUtilisateur().getPrenom() + " " + h.getUtilisateur().getNom()).trim()
                : "Système";
        String uEmail = h.getUtilisateur() != null ? h.getUtilisateur().getEmail() : null;

        Long dId = h.getDemande() != null ? h.getDemande().getId() : null;
        String dRef = h.getDemande() != null ? h.getDemande().getReferenceDemande() : null;

        Long wsId = h.getEspace() != null ? h.getEspace().getId() : null;
        String wsName = h.getEspace() != null ? h.getEspace().getNom() : null;

        Long tId = h.getTache() != null ? h.getTache().getId() : null;

        String resource = "SYSTEM";
        String resourceId = "-";
        if (h.getDemande() != null) {
            resource = "DEMANDE";
            resourceId = dRef != null ? dRef : String.valueOf(dId);
        } else if (h.getTache() != null) {
            resource = "TACHE";
            resourceId = String.valueOf(tId);
        } else if (h.getEspace() != null) {
            resource = "WORKSPACE";
            resourceId = wsName != null ? wsName : String.valueOf(wsId);
        }

        return new AuditLogResponse(
            h.getId(),
            h.getAction(),
            h.getDetails(),
            h.getDateAction(),
            uId,
            uName,
            uEmail,
            resource,
            resourceId,
            dId,
            dRef,
            wsId,
            wsName,
            tId
        );
    }
}
