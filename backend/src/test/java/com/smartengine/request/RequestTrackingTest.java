package com.smartengine.request;

import com.smartengine.request.service.RequestService;
import com.smartengine.request.entity.Demande;
import com.smartengine.request.repository.DemandeRepository;
import com.smartengine.task.entity.*;
import com.smartengine.task.repository.TacheRepository;
import com.smartengine.user.entity.Utilisateur;
import com.smartengine.process.entity.Processus;
import com.smartengine.workflow.entity.*;
import com.smartengine.workflow.repository.LienWorkflowRepository;
import com.smartengine.workflowinstance.entity.InstanceWorkflow;
import com.smartengine.request.entity.StatutDemande;
import com.smartengine.workspace.entity.Espace;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.*;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RequestTrackingTest {
    final DemandeRepository demandes = mock(DemandeRepository.class);
    final TacheRepository tasks = mock(TacheRepository.class);
    final LienWorkflowRepository links = mock(LienWorkflowRepository.class);
    final RequestService service = new RequestService(demandes, null, null, null, null, links, tasks, null, null);

    Demande request() {
        var d = new Demande(); d.setId(1L);
        var owner = new Utilisateur(); owner.setEmail("owner@test"); d.setCreePar(owner);
        var process = new Processus(); process.setId(2L); process.setNom("Leave"); d.setProcessus(process);
        return d;
    }
    Tache task(long id, String workspace, StatutTache status) {
        var t = new Tache(); t.setId(id); t.setStatut(status);
        t.setDateCreation(LocalDateTime.of(2026, 1, 1, 10, 0).plusHours(id));
        var node = new NoeudWorkflow(); node.setLibelle("Validation"); t.setNoeud(node);
        var ws = new Espace(); ws.setNom(workspace); t.setEspace(ws);
        if (status == StatutTache.APPROUVEE) t.setDateFin(t.getDateCreation().plusMinutes(10));
        return t;
    }
    @Test void ownerSeesDecisionsAndCurrentWorkspaceInChronologicalOrder() {
        when(demandes.findById(1L)).thenReturn(Optional.of(request()));
        var approved = task(1, "Manager", StatutTache.APPROUVEE);
        var pending = task(2, "Finance", StatutTache.EN_ATTENTE);
        when(tasks.findByInstance_Demande_IdOrderByDateCreationDesc(1L)).thenReturn(List.of(pending, approved));
        var result = service.getById(1L, "owner@test");
        assertEquals(List.of("Manager", "Finance"), result.validationSteps().stream().map(s -> s.workspaceName()).toList());
        assertEquals("APPROUVEE", result.validationSteps().get(0).status());
        assertNotNull(result.validationSteps().get(0).completedAt());
        assertEquals("EN_ATTENTE", result.validationSteps().get(1).status());
        assertNull(result.validationSteps().get(1).completedAt());
    }
    @Test void anotherEmployeeCannotReadTracking() {
        when(demandes.findById(1L)).thenReturn(Optional.of(request()));
        assertThrows(EntityNotFoundException.class, () -> service.getById(1L, "other@test"));
        verifyNoInteractions(tasks);
    }
    @Test void listUsesOnlyConnectedEmployeesRequests() {
        when(demandes.findByCreePar_EmailOrderByDateCreationDesc("owner@test")).thenReturn(List.of(request()));
        when(tasks.findByInstance_Demande_IdOrderByDateCreationDesc(1L)).thenReturn(List.of(task(1, "HR", StatutTache.REFUSEE)));
        var result = service.getMesDemandes("owner@test");
        assertEquals(1, result.size());
        assertEquals("REFUSEE", result.get(0).validationSteps().get(0).status());
        verify(demandes).findByCreePar_EmailOrderByDateCreationDesc("owner@test");
    }
    NoeudWorkflow node(long id, String workspace, TypeNoeud type) {
        var n = new NoeudWorkflow(); n.setId(id); n.setLibelle(workspace); n.setTypeNoeud(type);
        var ws = new Espace(); ws.setNom(workspace); n.setEspace(ws); return n;
    }
    LienWorkflow link(NoeudWorkflow from, NoeudWorkflow to, TypeBranche branch) {
        var l = new LienWorkflow(); l.setNoeudSource(from); l.setNoeudCible(to); l.setTypeBranche(branch); return l;
    }
    Demande setupRoute(boolean condition) {
        var d = request(); d.setStatut(StatutDemande.EN_COURS);
        var current = task(1, "Manager", StatutTache.EN_ATTENTE);
        var n1 = node(1, "Manager", TypeNoeud.APPROVAL);
        var n2 = node(2, "Finance", TypeNoeud.APPROVAL);
        var n3 = node(3, condition ? "Amount" : "Direction", condition ? TypeNoeud.CONDITION : TypeNoeud.APPROVAL);
        var end = node(4, "End", TypeNoeud.END);
        var wf = new Workflow(); wf.setId(9L);
        var instance = new InstanceWorkflow(); instance.setWorkflow(wf);
        current.setInstance(instance); current.setNoeud(n1);
        when(demandes.findById(1L)).thenReturn(Optional.of(d));
        when(tasks.findByInstance_Demande_IdOrderByDateCreationDesc(1L)).thenReturn(List.of(current));
        when(links.findByWorkflow_Id(9L)).thenReturn(List.of(link(n1,n2,TypeBranche.APPROVED),
            link(n1,end,TypeBranche.REJECTED), link(n2,n3,TypeBranche.APPROVED), link(n3,end,TypeBranche.DEFAULT)));
        return d;
    }
    @Test void showsFutureWorkspacesInWorkflowOrderWithoutRejectionBranch() {
        setupRoute(false);
        var steps = service.getById(1L, "owner@test").validationSteps();
        assertEquals(List.of("Manager", "Finance", "Direction"), steps.stream().map(s -> s.workspaceName()).toList());
        assertEquals(List.of("EN_ATTENTE", "A_VENIR", "A_VENIR"), steps.stream().map(s -> s.status()).toList());
        assertNull(steps.get(1).startedAt());
    }
    @Test void conditionalFutureIsExplicitInsteadOfInventingRoute() {
        setupRoute(true);
        var steps = service.getById(1L, "owner@test").validationSteps();
        assertEquals(3, steps.size());
        assertEquals("CONDITION_A_VENIR", steps.get(2).status());
        assertNull(steps.get(2).workspaceName());
    }
    @Test void closedRequestHasNoFutureSteps() {
        setupRoute(false).setStatut(StatutDemande.REFUSEE);
        assertEquals(1, service.getById(1L, "owner@test").validationSteps().size());
        verifyNoInteractions(links);
    }
}
