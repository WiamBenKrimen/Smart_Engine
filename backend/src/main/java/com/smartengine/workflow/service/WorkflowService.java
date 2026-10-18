package com.smartengine.workflow.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartengine.workflow.dto.*;
import com.smartengine.workflow.entity.*;
import com.smartengine.workflow.repository.*;
import com.smartengine.workflow.validator.WorkflowValidator;
import com.smartengine.workspace.entity.Espace;
import com.smartengine.workspace.repository.EspaceRepository;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WorkflowService {

    private final WorkflowRepository workflowRepo;
    private final NoeudWorkflowRepository nodeRepo;
    private final LienWorkflowRepository linkRepo;
    private final EspaceRepository workspaceRepo;
    private final WorkflowValidator validator;
    private final ObjectMapper mapper;

    public WorkflowService(
        WorkflowRepository workflowRepo,
        NoeudWorkflowRepository nodeRepo,
        LienWorkflowRepository linkRepo,
        EspaceRepository workspaceRepo,
        WorkflowValidator validator,
        ObjectMapper mapper
    ) {
        this.workflowRepo = workflowRepo;
        this.nodeRepo = nodeRepo;
        this.linkRepo = linkRepo;
        this.workspaceRepo = workspaceRepo;
        this.validator = validator;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<WorkflowResponse> list() {
        return workflowRepo.findAllByOrderByDateCreationDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public WorkflowResponse get(Long id) {
        Workflow wf = workflowRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Workflow introuvable : " + id));
        return toResponse(wf);
    }

    @Transactional
    public WorkflowResponse save(Long id, WorkflowRequest request) {
        Workflow wf = (id == null)
                ? new Workflow()
                : workflowRepo.findById(id).orElseThrow(() -> new EntityNotFoundException("Workflow introuvable : " + id));

        wf.setNom(request.name().trim());
        wf.setDescription(request.description());
        if (request.status() != null) {
            wf.setStatut(request.status());
        }

        wf = workflowRepo.save(wf);

        if (request.nodes() != null) {
            linkRepo.deleteByWorkflow_Id(wf.getId());
            linkRepo.flush();
            nodeRepo.deleteByWorkflow_Id(wf.getId());
            nodeRepo.flush();

            Map<String, NoeudWorkflow> nodeMap = new HashMap<>();

            for (WorkflowNodeDto n : request.nodes()) {
                NoeudWorkflow node = new NoeudWorkflow();
                node.setWorkflow(wf);
                node.setCleNoeud(n.id());
                node.setLibelle(n.label() != null ? n.label().trim() : n.id());
                node.setTypeNoeud(n.type());
                node.setPositionX(n.x() != null ? n.x() : BigDecimal.ZERO);
                node.setPositionY(n.y() != null ? n.y() : BigDecimal.ZERO);
                node.setSlaHeures(n.slaHours());

                if (n.workspaceId() != null && !n.workspaceId().isBlank()) {
                    try {
                        Long wsId = Long.valueOf(n.workspaceId().replace("ws", ""));
                        Espace espace = workspaceRepo.findById(wsId).orElse(null);
                        node.setEspace(espace);
                    } catch (NumberFormatException ignored) {}
                }

                Map<String, Object> config = new LinkedHashMap<>();
                if (n.conditionField() != null) config.put("conditionField", n.conditionField());
                if (n.conditionOperator() != null) config.put("conditionOperator", n.conditionOperator());
                if (n.conditionValue() != null) config.put("conditionValue", n.conditionValue());
                if (n.endResult() != null) config.put("endResult", n.endResult());
                if (n.assignedUserId() != null) config.put("assignedUserId", n.assignedUserId());

                if (!config.isEmpty()) {
                    try {
                        node.setConfigurationJson(mapper.writeValueAsString(config));
                    } catch (JsonProcessingException ex) {
                        throw new IllegalStateException("Erreur sérialisation config nœud", ex);
                    }
                }

                NoeudWorkflow savedNode = nodeRepo.save(node);
                nodeMap.put(n.id(), savedNode);
            }

            if (request.edges() != null) {
                for (WorkflowEdgeDto e : request.edges()) {
                    NoeudWorkflow src = nodeMap.get(e.from());
                    NoeudWorkflow tgt = nodeMap.get(e.to());
                    if (src != null && tgt != null) {
                        LienWorkflow link = new LienWorkflow();
                        link.setWorkflow(wf);
                        link.setNoeudSource(src);
                        link.setNoeudCible(tgt);

                        String label = e.label() != null ? e.label().toUpperCase() : "DEFAULT";
                        TypeBranche branche;
                        try {
                            branche = TypeBranche.valueOf(label);
                        } catch (IllegalArgumentException ex) {
                            branche = "NEXT".equalsIgnoreCase(label) ? TypeBranche.DEFAULT : TypeBranche.DEFAULT;
                        }
                        link.setTypeBranche(branche);
                        linkRepo.save(link);
                    }
                }
            }
        }

        return toResponse(wf);
    }

    @Transactional(readOnly = true)
    public WorkflowValidationResult validate(WorkflowRequest request) {
        return validator.validate(request.nodes(), request.edges());
    }

    private WorkflowResponse toResponse(Workflow wf) {
        List<NoeudWorkflow> nodes = nodeRepo.findByWorkflow_Id(wf.getId());
        List<LienWorkflow> links = linkRepo.findByWorkflow_Id(wf.getId());

        List<WorkflowNodeDto> nodeDtos = nodes.stream().map(n -> {
            String condField = null, condOp = null, condVal = null, endRes = null, userAssigned = null;
            if (n.getConfigurationJson() != null && !n.getConfigurationJson().isBlank()) {
                try {
                    JsonNode tree = mapper.readTree(n.getConfigurationJson());
                    if (tree.has("conditionField")) condField = tree.get("conditionField").asText();
                    if (tree.has("conditionOperator")) condOp = tree.get("conditionOperator").asText();
                    if (tree.has("conditionValue")) condVal = tree.get("conditionValue").asText();
                    if (tree.has("endResult")) endRes = tree.get("endResult").asText();
                    if (tree.has("assignedUserId")) userAssigned = tree.get("assignedUserId").asText();
                } catch (JsonProcessingException ignored) {}
            }

            String wsId = (n.getEspace() != null) ? "ws" + n.getEspace().getId() : null;

            return new WorkflowNodeDto(
                    n.getCleNoeud(),
                    n.getTypeNoeud(),
                    n.getLibelle(),
                    n.getPositionX(),
                    n.getPositionY(),
                    wsId,
                    n.getSlaHeures(),
                    condField,
                    condOp,
                    condVal,
                    endRes,
                    userAssigned
            );
        }).toList();

        List<WorkflowEdgeDto> edgeDtos = links.stream().map(l -> {
            String label = l.getTypeBranche() == TypeBranche.DEFAULT ? "NEXT" : l.getTypeBranche().name();
            return new WorkflowEdgeDto(
                    "e_" + l.getId(),
                    l.getNoeudSource().getCleNoeud(),
                    l.getNoeudCible().getCleNoeud(),
                    label
            );
        }).toList();

        return new WorkflowResponse(
                wf.getId(),
                wf.getNom(),
                wf.getDescription(),
                wf.getStatut(),
                wf.getDateCreation(),
                nodeDtos,
                edgeDtos,
                nodeDtos.size()
        );
    }
}
