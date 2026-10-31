package com.smartengine.task.dto;

import com.smartengine.request.entity.Demande;
import com.smartengine.task.entity.StatutTache;
import com.smartengine.task.entity.Tache;
import java.time.LocalDateTime;

public record TaskResponse(
    Long id,
    StatutTache statut,
    LocalDateTime dateCreation,
    LocalDateTime datePriseEnCharge,
    LocalDateTime dateFin,
    LocalDateTime dateLimite,
    String noeudCle,
    String noeudLibelle,
    String workspaceId,
    String workspaceName,
    Long assignedUserId,
    String assignedUserName,
    String assignedUserEmail,
    // Informations de la demande
    Long demandeId,
    String demandeReference,
    String processusNom,
    String processusIcon,
    String demandeStatut,
    String demandePriorite,
    String dataJson,
    String demandeurNom,
    String demandeurPrenom,
    String demandeurEmail,
    LocalDateTime demandeDateCreation
) {
    public static TaskResponse from(Tache t) {
        Demande d = (t.getInstance() != null) ? t.getInstance().getDemande() : null;

        String wsId = (t.getEspace() != null) ? "ws" + t.getEspace().getId() : null;
        String wsName = (t.getEspace() != null) ? t.getEspace().getNom() : null;

        Long assigneeId = (t.getAttribueA() != null) ? t.getAttribueA().getId() : null;
        String assigneeName = (t.getAttribueA() != null)
                ? (t.getAttribueA().getPrenom() + " " + t.getAttribueA().getNom()).trim()
                : null;
        String assigneeEmail = (t.getAttribueA() != null) ? t.getAttribueA().getEmail() : null;

        Long demId = (d != null) ? d.getId() : null;
        String demRef = (d != null) ? d.getReferenceDemande() : null;
        String procNom = (d != null && d.getProcessus() != null) ? d.getProcessus().getNom() : null;
        String procIcon = (d != null && d.getProcessus() != null) ? d.getProcessus().getIcon() : "📋";
        String demStatut = (d != null && d.getStatut() != null) ? d.getStatut().name() : null;
        String demPrio = (d != null && d.getPriorite() != null) ? d.getPriorite().name() : null;
        String data = (d != null) ? d.getDataJson() : "{}";
        String demNom = (d != null && d.getCreePar() != null) ? d.getCreePar().getNom() : null;
        String demPrenom = (d != null && d.getCreePar() != null) ? d.getCreePar().getPrenom() : null;
        String demEmail = (d != null && d.getCreePar() != null) ? d.getCreePar().getEmail() : null;
        LocalDateTime demDate = (d != null) ? d.getDateCreation() : null;

        String nCle = (t.getNoeud() != null) ? t.getNoeud().getCleNoeud() : null;
        String nLib = (t.getNoeud() != null) ? t.getNoeud().getLibelle() : null;

        return new TaskResponse(
            t.getId(),
            t.getStatut(),
            t.getDateCreation(),
            t.getDatePriseEnCharge(),
            t.getDateFin(),
            t.getDateLimite(),
            nCle,
            nLib,
            wsId,
            wsName,
            assigneeId,
            assigneeName,
            assigneeEmail,
            demId,
            demRef,
            procNom,
            procIcon,
            demStatut,
            demPrio,
            data,
            demNom,
            demPrenom,
            demEmail,
            demDate
        );
    }
}
