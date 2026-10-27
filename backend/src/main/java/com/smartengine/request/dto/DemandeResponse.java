package com.smartengine.request.dto;

import com.smartengine.request.entity.Demande;
import java.time.LocalDateTime;

public record DemandeResponse(
    Long id,
    String referenceDemande,
    Long processusId,
    String processusNom,
    String processusIcon,
    String statut,
    String priorite,
    String dataJson,
    LocalDateTime dateCreation,
    LocalDateTime dateFin
) {
    public static DemandeResponse from(Demande d) {
        return new DemandeResponse(
            d.getId(),
            d.getReferenceDemande(),
            d.getProcessus().getId(),
            d.getProcessus().getNom(),
            d.getProcessus().getIcon(),
            d.getStatut().name(),
            d.getPriorite().name(),
            d.getDataJson(),
            d.getDateCreation(),
            d.getDateFin()
        );
    }
}
