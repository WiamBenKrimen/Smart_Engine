package com.smartengine.request.service;

import com.smartengine.process.entity.Processus;
import com.smartengine.process.repository.ProcessusRepository;
import com.smartengine.request.dto.DemandeRequest;
import com.smartengine.request.dto.DemandeResponse;
import com.smartengine.request.dto.EmployeeDashboardResponse;
import com.smartengine.request.entity.Demande;
import com.smartengine.request.entity.StatutDemande;
import com.smartengine.request.repository.DemandeRepository;
import com.smartengine.user.entity.Utilisateur;
import com.smartengine.user.repository.UtilisateurRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartengine.task.entity.StatutTache;
import com.smartengine.task.entity.Tache;
import com.smartengine.task.repository.TacheRepository;
import com.smartengine.workflow.entity.LienWorkflow;
import com.smartengine.workflow.entity.NoeudWorkflow;
import com.smartengine.workflow.entity.TypeNoeud;
import com.smartengine.workflow.entity.Workflow;
import com.smartengine.workflow.repository.LienWorkflowRepository;
import com.smartengine.workflow.repository.NoeudWorkflowRepository;
import com.smartengine.workflowinstance.entity.InstanceWorkflow;
import com.smartengine.workflowinstance.entity.StatutInstanceWorkflow;
import com.smartengine.workflowinstance.repository.InstanceWorkflowRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RequestService {

    private final DemandeRepository demandeRepository;
    private final ProcessusRepository processusRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final InstanceWorkflowRepository instanceWorkflowRepository;
    private final NoeudWorkflowRepository noeudWorkflowRepository;
    private final LienWorkflowRepository lienWorkflowRepository;
    private final TacheRepository tacheRepository;
    private final ObjectMapper mapper;
    private final com.smartengine.audit.service.AuditService auditService;

    public RequestService(DemandeRepository demandeRepository,
                          ProcessusRepository processusRepository,
                          UtilisateurRepository utilisateurRepository,
                          InstanceWorkflowRepository instanceWorkflowRepository,
                          NoeudWorkflowRepository noeudWorkflowRepository,
                          LienWorkflowRepository lienWorkflowRepository,
                          TacheRepository tacheRepository,
                          ObjectMapper mapper,
                          com.smartengine.audit.service.AuditService auditService) {
        this.demandeRepository = demandeRepository;
        this.processusRepository = processusRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.instanceWorkflowRepository = instanceWorkflowRepository;
        this.noeudWorkflowRepository = noeudWorkflowRepository;
        this.lienWorkflowRepository = lienWorkflowRepository;
        this.tacheRepository = tacheRepository;
        this.mapper = mapper;
        this.auditService = auditService;
    }

    /** Retourne toutes les demandes de l'employé connecté, triées par date desc. */
    @Transactional(readOnly = true)
    public List<DemandeResponse> getMesDemandes(String email) {
        return demandeRepository.findByCreePar_EmailOrderByDateCreationDesc(email)
                .stream()
                .map(DemandeResponse::from)
                .toList();
    }

    /** Retourne le détail d'une demande (vérifie que l'auteur correspond). */
    @Transactional(readOnly = true)
    public DemandeResponse getById(Long id, String email) {
        Demande demande = demandeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Demande introuvable : " + id));
        if (!demande.getCreePar().getEmail().equals(email)) {
            throw new EntityNotFoundException("Demande introuvable : " + id);
        }
        return DemandeResponse.from(demande);
    }

    /** Crée et soumet une nouvelle demande, initialise l'instance de workflow et crée la première tâche. */
    @Transactional
    public DemandeResponse create(DemandeRequest req, String email) {
        Utilisateur employe = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur introuvable : " + email));

        Processus processus = processusRepository.findById(req.processusId())
                .orElseThrow(() -> new EntityNotFoundException("Processus introuvable : " + req.processusId()));

        Demande demande = new Demande();
        demande.setReferenceDemande(generateReference());
        demande.setProcessus(processus);
        demande.setCreePar(employe);
        demande.setStatut(StatutDemande.EN_COURS);
        demande.setDataJson(req.dataJson());
        demande.setDateCreation(LocalDateTime.now());
        demande = demandeRepository.save(demande);

        // Initialisation de l'instance de workflow et de la première tâche d'approbation
        Workflow workflow = processus.getWorkflow();
        if (workflow != null) {
            List<NoeudWorkflow> nodes = noeudWorkflowRepository.findByWorkflow_Id(workflow.getId());
            List<LienWorkflow> links = lienWorkflowRepository.findByWorkflow_Id(workflow.getId());

            NoeudWorkflow startNode = nodes.stream()
                    .filter(n -> n.getTypeNoeud() == TypeNoeud.START)
                    .findFirst()
                    .orElse(null);

            NoeudWorkflow firstStep = null;
            if (startNode != null) {
                firstStep = links.stream()
                        .filter(l -> l.getNoeudSource().getId().equals(startNode.getId()))
                        .map(LienWorkflow::getNoeudCible)
                        .findFirst()
                        .orElse(null);
            }

            if (firstStep == null) {
                firstStep = nodes.stream()
                        .filter(n -> n.getTypeNoeud() == TypeNoeud.APPROVAL)
                        .findFirst()
                        .orElse(null);
            }

            InstanceWorkflow instance = new InstanceWorkflow();
            instance.setDemande(demande);
            instance.setWorkflow(workflow);
            instance.setNoeudCourant(firstStep);
            instance.setStatut(StatutInstanceWorkflow.EN_COURS);
            instance.setDateDebut(LocalDateTime.now());
            instance = instanceWorkflowRepository.save(instance);

            if (firstStep != null && firstStep.getTypeNoeud() == TypeNoeud.APPROVAL) {
                Tache tache = new Tache();
                tache.setInstance(instance);
                tache.setNoeud(firstStep);
                tache.setEspace(firstStep.getEspace());
                tache.setStatut(StatutTache.EN_ATTENTE);
                tache.setDateCreation(LocalDateTime.now());

                if (firstStep.getConfigurationJson() != null && !firstStep.getConfigurationJson().isBlank()) {
                    try {
                        JsonNode tree = mapper.readTree(firstStep.getConfigurationJson());
                        if (tree.has("assignedUserId")) {
                            Long userId = Long.valueOf(tree.get("assignedUserId").asText());
                            utilisateurRepository.findById(userId).ifPresent(tache::setAttribueA);
                        }
                    } catch (Exception ignored) {}
                }

                tacheRepository.save(tache);
            }
        }

        auditService.log(
            demande,
            employe,
            null,
            null,
            "DEMANDE_CREEE",
            "Demande " + demande.getReferenceDemande() + " (" + processus.getNom() + ") soumise par " + employe.getPrenom() + " " + employe.getNom()
        );

        return DemandeResponse.from(demande);
    }

    /** Retourne les KPIs du tableau de bord de l'employé. */
    @Transactional(readOnly = true)
    public EmployeeDashboardResponse getDashboard(String email) {
        long total     = demandeRepository.countByCreePar_Email(email);
        long enCours   = demandeRepository.countByCreePar_EmailAndStatut(email, StatutDemande.EN_COURS);
        long terminees = demandeRepository.countByCreePar_EmailAndStatut(email, StatutDemande.TERMINEE);
        long refusees  = demandeRepository.countByCreePar_EmailAndStatut(email, StatutDemande.REFUSEE);
        return new EmployeeDashboardResponse(total, enCours, terminees, refusees);
    }

    // ── Utilitaires ──────────────────────────────────────────────────────────

    private String generateReference() {
        int year = Year.now().getValue();
        long count = demandeRepository.count() + 1;
        return String.format("DEM-%d-%05d", year, count);
    }
}
