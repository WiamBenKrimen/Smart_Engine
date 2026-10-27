package com.smartengine.request.controller;

import com.smartengine.request.dto.DemandeRequest;
import com.smartengine.request.dto.DemandeResponse;
import com.smartengine.request.dto.EmployeeDashboardResponse;
import com.smartengine.request.service.RequestService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/requests")
public class RequestController {

    private final RequestService requestService;

    public RequestController(RequestService requestService) {
        this.requestService = requestService;
    }

    /** GET /api/requests/mine — mes demandes (employé connecté) */
    @GetMapping("/mine")
    public List<DemandeResponse> mine(Principal principal) {
        return requestService.getMesDemandes(principal.getName());
    }

    /** GET /api/requests/dashboard — KPIs tableau de bord */
    @GetMapping("/dashboard")
    public EmployeeDashboardResponse dashboard(Principal principal) {
        return requestService.getDashboard(principal.getName());
    }

    /** GET /api/requests/{id} — détail d'une demande */
    @GetMapping("/{id}")
    public DemandeResponse getById(@PathVariable Long id, Principal principal) {
        return requestService.getById(id, principal.getName());
    }

    /** POST /api/requests — soumettre une nouvelle demande */
    @PostMapping
    public ResponseEntity<DemandeResponse> create(
            @Valid @RequestBody DemandeRequest request,
            Principal principal) {
        return ResponseEntity.ok(requestService.create(request, principal.getName()));
    }
}
