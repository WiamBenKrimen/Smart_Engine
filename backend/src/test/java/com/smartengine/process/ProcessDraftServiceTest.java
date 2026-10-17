package com.smartengine.process;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartengine.formbuilder.entity.*;
import com.smartengine.formbuilder.repository.*;
import com.smartengine.process.dto.ProcessDraftRequest;
import com.smartengine.process.entity.ProcessDraft;
import com.smartengine.process.repository.ProcessDraftRepository;
import com.smartengine.process.service.ProcessDraftService;
import com.smartengine.workspace.entity.Espace;
import com.smartengine.workspace.repository.EspaceRepository;
import jakarta.persistence.EntityNotFoundException;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class ProcessDraftServiceTest {
    ProcessDraftRepository drafts;
    FormulaireRepository forms;
    ChampFormulaireRepository fields;
    EspaceRepository workspaces;
    ProcessDraftService service;
    @BeforeEach void setup() {
        drafts = mock(ProcessDraftRepository.class); forms = mock(FormulaireRepository.class);
        fields = mock(ChampFormulaireRepository.class); workspaces = mock(EspaceRepository.class);
        service = new ProcessDraftService(drafts, forms, fields, workspaces, new ObjectMapper());
    }
    ProcessDraftRequest request(int step, List<String> ws, List<ProcessDraftRequest.Field> list) {
        return new ProcessDraftRequest("Teletravail", "Description", "icon", ws, "new", null, list, step);
    }
    ProcessDraftRequest.Field field(String key) {
        return new ProcessDraftRequest.Field("ui-id", TypeChamp.TEXT, key, "Objet", true, "Exemple", "Aide", List.of(), 0);
    }
    @Test void savesAndReadsInformationWithoutWorkflow() {
        when(drafts.save(any())).thenAnswer(call -> { ProcessDraft d = call.getArgument(0); d.setId(8L); return d; });
        var result = service.save(null, "admin@test", request(1, List.of(), List.of()));
        assertEquals(8, result.get("id").asInt()); assertEquals("Teletravail", result.get("name").asText());
        verifyNoInteractions(forms, fields);
    }
    @Test void draftOwnershipIsRequired() {
        when(drafts.findByIdAndOwnerEmail(8L, "other@test")).thenReturn(Optional.empty());
        assertThrows(EntityNotFoundException.class, () -> service.get(8L, "other@test"));
        assertThrows(EntityNotFoundException.class, () -> service.save(8L, "other@test", request(1, List.of(), List.of())));
        verify(drafts, never()).save(any());
    }
    @Test void stepTwoRequiresActiveWorkspace() {
        var ws = new Espace(); ws.setActif(false);
        when(workspaces.findById(1L)).thenReturn(Optional.of(ws));
        assertThrows(IllegalArgumentException.class, () -> service.save(null, "admin@test", request(2, List.of("ws1"), List.of())));
        verify(drafts, never()).save(any());
    }
    @Test void rejectsDuplicateFieldKeys() {
        assertThrows(IllegalArgumentException.class, () -> service.save(null, "admin@test", request(1, List.of(), List.of(field("objet"), field("objet")))));
        verifyNoInteractions(forms, fields);
    }
    @Test void persistsFormMetadataAndFields() {
        var ws = new Espace(); ws.setActif(true);
        when(workspaces.findById(1L)).thenReturn(Optional.of(ws));
        when(forms.save(any())).thenAnswer(call -> { Formulaire f = call.getArgument(0); f.setId(20L); return f; });
        when(drafts.save(any())).thenAnswer(call -> { ProcessDraft d = call.getArgument(0); d.setId(8L); return d; });
        var result = service.save(null, "admin@test", request(3, List.of("ws1"), List.of(field("objet"))));
        assertEquals(20, result.get("formId").asInt());
        verify(fields).save(argThat(f -> "objet".equals(f.getCleChamp()) && "Exemple".equals(f.getPlaceholder()) && "Aide".equals(f.getHelpText()) && f.getFormulaire().getId() == 20L));
    }
    @Test void reusingTemplateDoesNotModifyItsFields() {
        var template = new Formulaire(); template.setId(20L); template.setActif(true);
        when(forms.findById(20L)).thenReturn(Optional.of(template));
        when(drafts.save(any())).thenAnswer(call -> { ProcessDraft d = call.getArgument(0); d.setId(8L); return d; });
        service.save(null, "admin@test", new ProcessDraftRequest("Teletravail", "", "icon", List.of(), "reuse", "20", List.of(field("objet")), 1));
        verifyNoInteractions(fields); verify(forms, never()).save(any());
    }
    @Test void noDraftReturnsNoSnapshot() {
        when(drafts.findFirstByOwnerEmailOrderByIdDesc("admin@test")).thenReturn(Optional.empty());
        assertNull(service.latest("admin@test"));
    }
}
