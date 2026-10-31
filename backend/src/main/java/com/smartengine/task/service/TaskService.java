package com.smartengine.task.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartengine.request.entity.Demande;
import com.smartengine.request.entity.StatutDemande;
import com.smartengine.request.repository.DemandeRepository;
import com.smartengine.task.dto.TaskResponse;
import com.smartengine.task.entity.StatutTache;
import com.smartengine.task.entity.Tache;
import com.smartengine.task.repository.TacheRepository;
import com.smartengine.user.entity.Utilisateur;
import com.smartengine.user.repository.UtilisateurRepository;
import com.smartengine.workflow.entity.LienWorkflow;
import com.smartengine.workflow.entity.NoeudWorkflow;
import com.smartengine.workflow.entity.TypeBranche;
import com.smartengine.workflow.entity.TypeNoeud;
import com.smartengine.workflow.repository.LienWorkflowRepository;
import com.smartengine.workflowinstance.entity.InstanceWorkflow;
import com.smartengine.workflowinstance.entity.StatutInstanceWorkflow;
import com.smartengine.workflowinstance.repository.InstanceWorkflowRepository;
import com.smartengine.workspace.entity.MembreEspace;
import com.smartengine.workspace.repository.MembreEspaceRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TacheRepository tacheRepository;
    private final DemandeRepository demandeRepository;
    private final InstanceWorkflowRepository instanceRepository;
    private final LienWorkflowRepository lienRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final MembreEspaceRepository membreEspaceRepository;
    private final ObjectMapper mapper;
    private final com.smartengine.audit.service.AuditService auditService;

    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksForUser(String email) {
        Utilisateur user = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur introuvable : " + email));

        List<MembreEspace> memberships = membreEspaceRepository.findByUtilisateur_Id(user.getId());
        List<Long> wsIds = memberships.stream()
                .map(m -> m.getEspace().getId())
                .toList();

        List<Tache> tasks;
        if (wsIds.isEmpty()) {
            tasks = tacheRepository.findByAttribueA_EmailOrderByDateCreationDesc(email);
        } else {
            tasks = tacheRepository.findAssignedOrClaimable(email, wsIds);
        }

        return tasks.stream().map(TaskResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByWorkspace(Long workspaceId) {
        return tacheRepository.findByEspace_IdOrderByDateCreationDesc(workspaceId)
                .stream()
                .map(TaskResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public TaskResponse getTaskById(Long id) {
        Tache tache = tacheRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Tâche introuvable : " + id));
        return TaskResponse.from(tache);
    }

    @Transactional
    public TaskResponse claimTask(Long id, String email) {
        Tache tache = tacheRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Tâche introuvable : " + id));

        Utilisateur user = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur introuvable : " + email));

        tache.setAttribueA(user);
        tache.setDatePriseEnCharge(LocalDateTime.now());
        if (tache.getStatut() == StatutTache.EN_ATTENTE) {
            tache.setStatut(StatutTache.EN_COURS);
        }

        Tache saved = tacheRepository.save(tache);

        auditService.log(
            saved.getInstance() != null ? saved.getInstance().getDemande() : null,
            user,
            saved.getEspace(),
            saved,
            "TACHE_PRISE",
            user.getPrenom() + " " + user.getNom() + " a pris en charge la tâche #" + saved.getId()
        );

        return TaskResponse.from(saved);
    }

    @Transactional
    public TaskResponse approveTask(Long id, String comment, String email) {
        Tache tache = tacheRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Tâche introuvable : " + id));

        Utilisateur user = utilisateurRepository.findByEmail(email).orElse(null);

        tache.setStatut(StatutTache.APPROUVEE);
        tache.setDateFin(LocalDateTime.now());
        tache = tacheRepository.save(tache);

        InstanceWorkflow instance = tache.getInstance();
        Demande demande = instance != null ? instance.getDemande() : null;

        auditService.log(
            demande,
            user,
            tache.getEspace(),
            tache,
            "APPROUVEE",
            (user != null ? user.getPrenom() + " " + user.getNom() : email) + " a approuvé la demande"
                + (comment != null && !comment.isBlank() ? " (motif : " + comment + ")" : "")
        );

        if (instance != null) {
            NoeudWorkflow currentNoeud = tache.getNoeud();

            List<LienWorkflow> links = lienRepository.findByWorkflow_Id(instance.getWorkflow().getId());
            LienWorkflow nextLink = links.stream()
                    .filter(l -> l.getNoeudSource().getId().equals(currentNoeud.getId())
                            && (l.getTypeBranche() == TypeBranche.APPROVED || l.getTypeBranche() == TypeBranche.DEFAULT))
                    .findFirst()
                    .orElse(null);

            if (nextLink != null) {
                NoeudWorkflow target = nextLink.getNoeudCible();
                if (target.getTypeNoeud() == TypeNoeud.END) {
                    instance.setStatut(StatutInstanceWorkflow.TERMINEE);
                    instance.setDateFin(LocalDateTime.now());
                    instance.setNoeudCourant(target);
                    instanceRepository.save(instance);

                    if (demande != null) {
                        demande.setStatut(StatutDemande.TERMINEE);
                        demande.setDateFin(LocalDateTime.now());
                        demandeRepository.save(demande);
                    }
                } else if (target.getTypeNoeud() == TypeNoeud.APPROVAL) {
                    instance.setNoeudCourant(target);
                    instanceRepository.save(instance);
                    createTaskForApprovalNode(instance, target);
                }
            } else {
                instance.setStatut(StatutInstanceWorkflow.TERMINEE);
                instance.setDateFin(LocalDateTime.now());
                instanceRepository.save(instance);

                if (demande != null) {
                    demande.setStatut(StatutDemande.TERMINEE);
                    demande.setDateFin(LocalDateTime.now());
                    demandeRepository.save(demande);
                }
            }
        }

        return TaskResponse.from(tache);
    }

    @Transactional
    public TaskResponse rejectTask(Long id, String comment, String email) {
        Tache tache = tacheRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Tâche introuvable : " + id));

        Utilisateur user = utilisateurRepository.findByEmail(email).orElse(null);

        tache.setStatut(StatutTache.REFUSEE);
        tache.setDateFin(LocalDateTime.now());
        tache = tacheRepository.save(tache);

        InstanceWorkflow instance = tache.getInstance();
        Demande demande = instance != null ? instance.getDemande() : null;

        auditService.log(
            demande,
            user,
            tache.getEspace(),
            tache,
            "REFUSEE",
            (user != null ? user.getPrenom() + " " + user.getNom() : email) + " a refusé la demande"
                + (comment != null && !comment.isBlank() ? " (motif : " + comment + ")" : "")
        );

        if (instance != null) {
            instance.setStatut(StatutInstanceWorkflow.REFUSEE);
            instance.setDateFin(LocalDateTime.now());
            instanceRepository.save(instance);

            if (demande != null) {
                demande.setStatut(StatutDemande.REFUSEE);
                demande.setDateFin(LocalDateTime.now());
                demandeRepository.save(demande);
            }
        }

        return TaskResponse.from(tache);
    }

    public void createTaskForApprovalNode(InstanceWorkflow instance, NoeudWorkflow node) {
        Tache nextTask = new Tache();
        nextTask.setInstance(instance);
        nextTask.setNoeud(node);
        nextTask.setEspace(node.getEspace());
        nextTask.setStatut(StatutTache.EN_ATTENTE);
        nextTask.setDateCreation(LocalDateTime.now());

        if (node.getConfigurationJson() != null && !node.getConfigurationJson().isBlank()) {
            try {
                JsonNode tree = mapper.readTree(node.getConfigurationJson());
                if (tree.has("assignedUserId")) {
                    Long userId = Long.valueOf(tree.get("assignedUserId").asText());
                    utilisateurRepository.findById(userId).ifPresent(nextTask::setAttribueA);
                }
            } catch (Exception ignored) {}
        }

        tacheRepository.save(nextTask);
    }
}
