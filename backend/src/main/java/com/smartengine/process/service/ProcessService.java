package com.smartengine.process.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartengine.formbuilder.entity.ChampFormulaire;
import com.smartengine.formbuilder.entity.Formulaire;
import com.smartengine.formbuilder.entity.TypeChamp;
import com.smartengine.formbuilder.repository.ChampFormulaireRepository;
import com.smartengine.formbuilder.repository.FormulaireRepository;
import com.smartengine.process.dto.ProcessCreateRequest;
import com.smartengine.process.dto.ProcessResponse;
import com.smartengine.process.dto.ProcessValidationResult;
import com.smartengine.process.entity.Processus;
import com.smartengine.process.repository.ProcessDraftRepository;
import com.smartengine.process.repository.ProcessusRepository;
import com.smartengine.workflow.dto.WorkflowNodeDto;
import com.smartengine.workflow.dto.WorkflowRequest;
import com.smartengine.workflow.dto.WorkflowResponse;
import com.smartengine.workflow.dto.WorkflowValidationResult;
import com.smartengine.workflow.entity.TypeNoeud;
import com.smartengine.workflow.entity.Workflow;
import com.smartengine.workflow.entity.WorkflowStatut;
import com.smartengine.workflow.repository.NoeudWorkflowRepository;
import com.smartengine.workflow.repository.WorkflowRepository;
import com.smartengine.workflow.service.WorkflowService;
import com.smartengine.workflow.validator.WorkflowValidator;
import jakarta.persistence.EntityNotFoundException;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProcessService {

    private final ProcessusRepository processRepo;
    private final ProcessDraftRepository draftRepo;
    private final FormulaireRepository formRepo;
    private final ChampFormulaireRepository fieldRepo;
    private final WorkflowRepository workflowRepo;
    private final NoeudWorkflowRepository nodeRepo;
    private final WorkflowService workflowService;
    private final WorkflowValidator workflowValidator;
    private final ObjectMapper mapper;

    public ProcessService(
        ProcessusRepository processRepo,
        ProcessDraftRepository draftRepo,
        FormulaireRepository formRepo,
        ChampFormulaireRepository fieldRepo,
        WorkflowRepository workflowRepo,
        NoeudWorkflowRepository nodeRepo,
        WorkflowService workflowService,
        WorkflowValidator workflowValidator,
        ObjectMapper mapper
    ) {
        this.processRepo = processRepo;
        this.draftRepo = draftRepo;
        this.formRepo = formRepo;
        this.fieldRepo = fieldRepo;
        this.workflowRepo = workflowRepo;
        this.nodeRepo = nodeRepo;
        this.workflowService = workflowService;
        this.workflowValidator = workflowValidator;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<ProcessResponse> list() {
        return processRepo.findAllByOrderByDateCreationDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProcessResponse get(Long id) {
        Processus p = processRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Processus introuvable : " + id));
        return toResponse(p);
    }

    @Transactional
    public ProcessResponse createOrPublish(ProcessCreateRequest request, String ownerEmail) {
        // Validation check
        ProcessValidationResult validation = validate(request);
        if (!validation.valid()) {
            throw new IllegalArgumentException(String.join(", ", validation.errors()));
        }

        // 1. Formulaire
        Formulaire form;
        if ("reuse".equalsIgnoreCase(request.formMode()) && request.formRefId() != null && !request.formRefId().isBlank()) {
            Long fId = Long.valueOf(request.formRefId());
            form = formRepo.findById(fId)
                    .orElseThrow(() -> new EntityNotFoundException("Formulaire introuvable : " + fId));
        } else {
            Long existingFormId = request.formId();
            form = (existingFormId != null)
                    ? formRepo.findById(existingFormId).orElse(new Formulaire())
                    : new Formulaire();

            form.setNom(request.name().trim());
            form.setDescription(request.description());
            form.setActif(true);
            form = formRepo.save(form);

            if (request.formFields() != null && !request.formFields().isEmpty()) {
                fieldRepo.deleteByFormulaire_Id(form.getId());
                fieldRepo.flush();

                int order = 0;
                for (var input : request.formFields()) {
                    ChampFormulaire field = new ChampFormulaire();
                    field.setFormulaire(form);
                    field.setCleChamp(input.key());
                    field.setLibelle(input.label().trim());
                    field.setTypeChamp(input.type());
                    field.setObligatoire(input.required());
                    field.setOptionsJson(json(input.options() == null ? List.of() : input.options()));
                    field.setPlaceholder(input.placeholder());
                    field.setHelpText(input.helpText());
                    field.setOrdreAffichage(order++);
                    fieldRepo.save(field);
                }
            }
        }

        // 2. Workflow
        Workflow workflow;
        WorkflowStatut targetStatus = (request.status() != null) ? request.status() : WorkflowStatut.PUBLIE;

        if ("reuse".equalsIgnoreCase(request.wfMode()) && request.wfRefId() != null && !request.wfRefId().isBlank()) {
            Long wfId = Long.valueOf(request.wfRefId().replace("wf-", "").replace("wf_", ""));
            workflow = workflowRepo.findById(wfId)
                    .orElseThrow(() -> new EntityNotFoundException("Workflow introuvable : " + wfId));
            if (targetStatus == WorkflowStatut.PUBLIE && workflow.getStatut() != WorkflowStatut.PUBLIE) {
                workflow.setStatut(WorkflowStatut.PUBLIE);
                workflow = workflowRepo.save(workflow);
            }
        } else {
            Long wfIdToUpdate = request.workflowId();
            WorkflowRequest wfReq = new WorkflowRequest(
                    request.name().trim() + " - Workflow",
                    request.description(),
                    targetStatus,
                    request.wfNodes(),
                    request.wfEdges()
            );
            WorkflowResponse savedWf = workflowService.save(wfIdToUpdate, wfReq);
            workflow = workflowRepo.findById(savedWf.id())
                    .orElseThrow(() -> new EntityNotFoundException("Erreur lors de la sauvegarde du workflow"));
        }

        // 3. Processus
        Processus processus = new Processus();
        processus.setNom(request.name().trim());
        processus.setDescription(request.description());
        processus.setIcon(request.icon() != null && !request.icon().isBlank() ? request.icon() : "📋");
        processus.setFormulaire(form);
        processus.setWorkflow(workflow);
        processus.setStatut(targetStatus);
        processus.setWorkspacesJson(json(request.workspaceIds() == null ? List.of() : request.workspaceIds()));

        processus = processRepo.save(processus);

        // 4. Draft cleanup
        if (request.draftId() != null) {
            try {
                draftRepo.deleteById(request.draftId());
            } catch (Exception ignored) {}
        }

        return toResponse(processus);
    }

    @Transactional
    public ProcessResponse updateStatus(Long id, WorkflowStatut statut) {
        Processus p = processRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Processus introuvable : " + id));
        p.setStatut(statut);
        if (p.getWorkflow() != null) {
            p.getWorkflow().setStatut(statut);
            workflowRepo.save(p.getWorkflow());
        }
        return toResponse(processRepo.save(p));
    }

    @Transactional(readOnly = true)
    public ProcessValidationResult validate(ProcessCreateRequest request) {
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        if (request.name() == null || request.name().trim().isBlank()) {
            errors.add("Le nom du processus est obligatoire.");
        }

        // Form check
        if ("reuse".equalsIgnoreCase(request.formMode())) {
            if (request.formRefId() == null || request.formRefId().isBlank()) {
                errors.add("Veuillez sélectionner un formulaire existant.");
            }
        } else {
            if (request.formFields() == null || request.formFields().isEmpty()) {
                errors.add("Le formulaire doit contenir au moins un champ.");
            } else {
                Set<String> keys = new HashSet<>();
                for (var field : request.formFields()) {
                    if (field.label() == null || field.label().trim().isBlank()) {
                        errors.add("Tous les champs du formulaire doivent avoir un libellé.");
                    }
                    if (field.key() == null || !field.key().matches("^[a-zA-Z][a-zA-Z0-9_]*$")) {
                        errors.add("Clé technique invalide pour le champ '" + field.label() + "'.");
                    } else if (!keys.add(field.key())) {
                        errors.add("La clé technique '" + field.key() + "' est utilisée plusieurs fois.");
                    }
                    if (field.type() == TypeChamp.SELECT && (field.options() == null || field.options().isEmpty())) {
                        errors.add("Le champ liste '" + field.label() + "' doit contenir au moins une option.");
                    }
                }
            }
        }

        // Workflow check
        if ("reuse".equalsIgnoreCase(request.wfMode())) {
            if (request.wfRefId() == null || request.wfRefId().isBlank()) {
                errors.add("Veuillez sélectionner un workflow existant.");
            }
        } else {
            WorkflowValidationResult wfResult = workflowValidator.validate(request.wfNodes(), request.wfEdges());
            errors.addAll(wfResult.errors());
            warnings.addAll(wfResult.warnings());

            // Cross-check condition fields against form fields
            if (request.formFields() != null && request.wfNodes() != null) {
                Set<String> validKeys = new HashSet<>();
                request.formFields().forEach(f -> validKeys.add(f.key()));

                for (WorkflowNodeDto n : request.wfNodes()) {
                    if (n.type() == TypeNoeud.CONDITION && n.conditionField() != null && !n.conditionField().isBlank()) {
                        if (!validKeys.isEmpty() && !validKeys.contains(n.conditionField())) {
                            errors.add("La condition '" + n.label() + "' référence le champ '" + n.conditionField() + "' qui n'existe pas dans le formulaire.");
                        }
                    }
                }
            }
        }

        return new ProcessValidationResult(errors.isEmpty(), errors, warnings);
    }

    private ProcessResponse toResponse(Processus p) {
        Long formId = p.getFormulaire() != null ? p.getFormulaire().getId() : null;
        String formName = p.getFormulaire() != null ? p.getFormulaire().getNom() : null;
        Long wfId = p.getWorkflow() != null ? p.getWorkflow().getId() : null;
        String wfName = p.getWorkflow() != null ? p.getWorkflow().getNom() : null;

        List<String> wsIds = List.of();
        if (p.getWorkspacesJson() != null && !p.getWorkspacesJson().isBlank()) {
            try {
                wsIds = mapper.readValue(p.getWorkspacesJson(), new TypeReference<List<String>>() {});
            } catch (JsonProcessingException ignored) {}
        }

        int fieldCount = (formId != null) ? fieldRepo.countByFormulaire_Id(formId) : 0;
        int nodeCount = (wfId != null) ? nodeRepo.findByWorkflow_Id(wfId).size() : 0;

        return new ProcessResponse(
                p.getId(),
                p.getNom(),
                p.getDescription(),
                p.getIcon(),
                p.getStatut(),
                p.getDateCreation(),
                formId,
                formName,
                wfId,
                wfName,
                wsIds,
                fieldCount,
                nodeCount
        );
    }

    private String json(Object value) {
        try {
            return mapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Erreur sérialisation JSON", ex);
        }
    }
}
