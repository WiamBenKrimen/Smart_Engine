package com.smartengine.formbuilder.controller;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartengine.formbuilder.entity.Formulaire;
import com.smartengine.formbuilder.repository.*;
import jakarta.persistence.EntityNotFoundException;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/forms") @RequiredArgsConstructor
public class FormCatalogController {
    private final FormulaireRepository forms;
    private final ChampFormulaireRepository fields;
    private final ObjectMapper mapper;
    @GetMapping @Transactional(readOnly=true)
    public List<Map<String, Object>> list() { return forms.findAll().stream().filter(f -> Boolean.TRUE.equals(f.getActif())).map(this::response).toList(); }
    @GetMapping("/{id}") @Transactional(readOnly=true)
    public Map<String, Object> get(@PathVariable Long id) { return response(forms.findById(id).orElseThrow(() -> new EntityNotFoundException("Formulaire introuvable."))); }
    private Map<String, Object> response(Formulaire form) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", form.getId().toString()); result.put("name", form.getNom()); result.put("description", form.getDescription());
        result.put("fields", fields.findByFormulaire_IdOrderByOrdreAffichageAsc(form.getId()).stream().map(f -> {
            Map<String, Object> field = new LinkedHashMap<>();
            field.put("id", f.getId().toString()); field.put("key", f.getCleChamp()); field.put("label", f.getLibelle()); field.put("type", f.getTypeChamp()); field.put("required", f.getObligatoire()); field.put("order", f.getOrdreAffichage());
            field.put("placeholder", f.getPlaceholder() == null ? "" : f.getPlaceholder()); field.put("helpText", f.getHelpText() == null ? "" : f.getHelpText());
            try { field.put("options", f.getOptionsJson() == null ? List.of() : mapper.readTree(f.getOptionsJson())); }
            catch (JsonProcessingException ex) { throw new IllegalStateException("Options de formulaire invalides.", ex); }
            return field;
        }).toList());
        return result;
    }
}
