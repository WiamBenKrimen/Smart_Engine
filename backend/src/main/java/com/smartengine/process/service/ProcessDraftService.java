package com.smartengine.process.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.smartengine.formbuilder.entity.*;
import com.smartengine.formbuilder.repository.*;
import com.smartengine.process.dto.ProcessDraftRequest;
import com.smartengine.process.entity.ProcessDraft;
import com.smartengine.process.repository.ProcessDraftRepository;
import com.smartengine.workspace.repository.EspaceRepository;
import jakarta.persistence.EntityNotFoundException;
import java.util.HashSet;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor
public class ProcessDraftService {
    private final ProcessDraftRepository drafts;
    private final FormulaireRepository forms;
    private final ChampFormulaireRepository fields;
    private final EspaceRepository workspaces;
    private final ObjectMapper mapper;

    @Transactional(readOnly=true)
    public ObjectNode latest(String email) {
        return drafts.findFirstByOwnerEmailOrderByIdDesc(email).map(this::response).orElse(null);
    }
    @Transactional(readOnly=true)
    public ObjectNode get(Long id, String email) { return response(find(id, email)); }
    private ProcessDraft find(Long id, String email) {
        return drafts.findByIdAndOwnerEmail(id, email).orElseThrow(() -> new EntityNotFoundException("Brouillon introuvable."));
    }
    @Transactional
    public ObjectNode save(Long id, String email, ProcessDraftRequest request) {
        ProcessDraft draft = id == null ? new ProcessDraft() : find(id, email);
        draft.setOwnerEmail(email);
        boolean hasActiveWorkspace = false;
        for (String wsId : request.workspaceIds()) {
            Long dbId;
            try { dbId = Long.valueOf(wsId.startsWith("ws") ? wsId.substring(2) : wsId); }
            catch (NumberFormatException ex) { throw new IllegalArgumentException("Identifiant workspace invalide."); }
            var ws = workspaces.findById(dbId).orElseThrow(() -> new EntityNotFoundException("Workspace introuvable."));
            hasActiveWorkspace |= Boolean.TRUE.equals(ws.getActif());
        }
        if (request.savedStep() >= 2 && !hasActiveWorkspace) throw new IllegalArgumentException("Associez au moins un workspace actif.");
        var keys = new HashSet<String>();
        for (var field : request.formFields()) {
            if (!keys.add(field.key())) throw new IllegalArgumentException("Les cles des champs doivent etre uniques.");
            if (field.type() == TypeChamp.SELECT && (field.options() == null || field.options().isEmpty())) throw new IllegalArgumentException("Une liste doit contenir au moins une option.");
        }
        if (request.savedStep() >= 3 && request.formFields().isEmpty()) throw new IllegalArgumentException("Ajoutez au moins un champ.");
        if ("reuse".equals(request.formMode())) {
            if (request.formRefId() == null || request.formRefId().isBlank()) throw new IllegalArgumentException("Choisissez un formulaire.");
            draft.setFormulaire(forms.findById(Long.valueOf(request.formRefId())).filter(f -> Boolean.TRUE.equals(f.getActif())).orElseThrow(() -> new EntityNotFoundException("Formulaire introuvable.")));
            draft.setOwnsForm(false);
        } else if (!request.formFields().isEmpty()) {
            Formulaire form = draft.isOwnsForm() ? draft.getFormulaire() : new Formulaire();
            form.setNom(request.name().trim());
            form.setDescription(request.description());
            form = forms.save(form);
            fields.deleteByFormulaire_Id(form.getId());
            fields.flush();
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
                fields.save(field);
            }
            draft.setFormulaire(form);
            draft.setOwnsForm(true);
        } else {
            draft.setFormulaire(null);
            draft.setOwnsForm(false);
        }
        draft.setPayload(json(request));
        return response(drafts.save(draft));
    }
    private String json(Object value) {
        try { return mapper.writeValueAsString(value); }
        catch (JsonProcessingException ex) { throw new IllegalStateException("Serialization impossible.", ex); }
    }
    private ObjectNode response(ProcessDraft draft) {
        try {
            ObjectNode result = (ObjectNode) mapper.readTree(draft.getPayload());
            result.put("id", draft.getId());
            if (draft.getFormulaire() != null) result.put("formId", draft.getFormulaire().getId());
            return result;
        } catch (JsonProcessingException ex) { throw new IllegalStateException("Brouillon illisible.", ex); }
    }
}
