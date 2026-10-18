package com.smartengine.workflow.validator;

import com.smartengine.workflow.dto.WorkflowEdgeDto;
import com.smartengine.workflow.dto.WorkflowNodeDto;
import com.smartengine.workflow.dto.WorkflowValidationResult;
import com.smartengine.workflow.entity.TypeNoeud;
import java.util.*;
import org.springframework.stereotype.Component;

@Component
public class WorkflowValidator {

    public WorkflowValidationResult validate(List<WorkflowNodeDto> nodes, List<WorkflowEdgeDto> edges) {
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        if (nodes == null || nodes.isEmpty()) {
            errors.add("Le workflow ne contient aucun nœud.");
            return new WorkflowValidationResult(false, errors, warnings);
        }

        List<WorkflowEdgeDto> safeEdges = edges == null ? List.of() : edges;

        // START node checks
        long startCount = nodes.stream().filter(n -> n.type() == TypeNoeud.START).count();
        if (startCount == 0) {
            errors.add("Nœud de départ (START) absent.");
        } else if (startCount > 1) {
            errors.add("Un seul nœud de départ (START) est autorisé.");
        }

        // END node checks
        long endCount = nodes.stream().filter(n -> n.type() == TypeNoeud.END).count();
        if (endCount == 0) {
            errors.add("Au moins un nœud de fin (END) est requis.");
        }

        Set<String> nodeIds = new HashSet<>();
        for (WorkflowNodeDto n : nodes) {
            if (n.id() == null || n.id().isBlank()) {
                errors.add("Un nœud sans identifiant valide a été détecté.");
            } else if (!nodeIds.add(n.id())) {
                errors.add("Identifiant de nœud en double : " + n.id());
            }

            // Isolated nodes check
            boolean hasIncoming = safeEdges.stream().anyMatch(e -> n.id().equals(e.to()));
            boolean hasOutgoing = safeEdges.stream().anyMatch(e -> n.id().equals(e.from()));

            if (!hasIncoming && !hasOutgoing) {
                errors.add("Le nœud '" + n.label() + "' est complètement isolé.");
            }

            if (n.type() == TypeNoeud.START) {
                if (hasIncoming) {
                    errors.add("Le nœud START ne peut pas avoir de connexion entrante.");
                }
                if (!hasOutgoing) {
                    errors.add("Le nœud START doit avoir au moins une connexion sortante.");
                }
            } else if (n.type() == TypeNoeud.END) {
                if (hasOutgoing) {
                    errors.add("Le nœud END ('" + n.label() + "') ne peut pas avoir de connexion sortante.");
                }
                if (!hasIncoming) {
                    errors.add("Le nœud END ('" + n.label() + "') doit avoir au moins une connexion entrante.");
                }
            } else if (n.type() == TypeNoeud.APPROVAL) {
                if (n.workspaceId() == null || n.workspaceId().isBlank()) {
                    errors.add("L'étape d'approbation '" + n.label() + "' doit avoir un Workspace responsable assigné.");
                }
                boolean hasApproved = safeEdges.stream().anyMatch(e -> n.id().equals(e.from()) && "APPROVED".equalsIgnoreCase(e.label()));
                boolean hasRejected = safeEdges.stream().anyMatch(e -> n.id().equals(e.from()) && "REJECTED".equalsIgnoreCase(e.label()));
                if (!hasApproved) {
                    errors.add("L'étape d'approbation '" + n.label() + "' doit avoir une branche sortante 'APPROUVÉ'.");
                }
                if (!hasRejected) {
                    errors.add("L'étape d'approbation '" + n.label() + "' doit avoir une branche sortante 'REFUSÉ'.");
                }
            } else if (n.type() == TypeNoeud.CONDITION) {
                if (n.conditionField() == null || n.conditionField().isBlank()) {
                    errors.add("La condition '" + n.label() + "' doit référencer un champ du formulaire.");
                }
                if (n.conditionValue() == null || n.conditionValue().isBlank()) {
                    errors.add("La condition '" + n.label() + "' doit avoir une valeur de comparaison.");
                }
                boolean hasTrue = safeEdges.stream().anyMatch(e -> n.id().equals(e.from()) && "TRUE".equalsIgnoreCase(e.label()));
                boolean hasFalse = safeEdges.stream().anyMatch(e -> n.id().equals(e.from()) && "FALSE".equalsIgnoreCase(e.label()));
                if (!hasTrue) {
                    errors.add("La condition '" + n.label() + "' doit avoir une branche 'VRAI'.");
                }
                if (!hasFalse) {
                    errors.add("La condition '" + n.label() + "' doit avoir une branche 'FAUX'.");
                }
            }
        }

        // Edge checks
        for (WorkflowEdgeDto edge : safeEdges) {
            if (edge.from() == null || !nodeIds.contains(edge.from())) {
                errors.add("Liaison invalide : source inconnue '" + edge.from() + "'.");
            }
            if (edge.to() == null || !nodeIds.contains(edge.to())) {
                errors.add("Liaison invalide : cible inconnue '" + edge.to() + "'.");
            }
            if (edge.from() != null && edge.from().equals(edge.to())) {
                errors.add("Une étape ne peut pas être connectée directement à elle-même.");
            }
        }

        return new WorkflowValidationResult(errors.isEmpty(), errors, warnings);
    }
}
