package com.smartengine.request.dto;

import com.smartengine.request.entity.Demande;
import java.time.LocalDateTime;
import java.util.List;
import com.smartengine.task.entity.Tache;

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
    LocalDateTime dateFin,
    List<ValidationStep> validationSteps
) {
    public static DemandeResponse from(Demande d) {
        return from(d, List.of());
    }

    public static DemandeResponse from(Demande d, List<Tache> tasks) {
        return withSteps(d, tasks.stream().map(ValidationStep::from).toList());
    }

    public static DemandeResponse withSteps(Demande d, List<ValidationStep> steps) {
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
            d.getDateFin(),
            steps
        );
    }
    public record ValidationStep(Long id, String nodeLabel, String workspaceName,
                                 String status, LocalDateTime startedAt, LocalDateTime completedAt) {
        public static ValidationStep from(Tache task) {
            return new ValidationStep(task.getId(), task.getNoeud().getLibelle(),
                    task.getEspace() == null ? null : task.getEspace().getNom(),
                    task.getStatut().name(), task.getDateCreation(), task.getDateFin());
        }
    }
}
