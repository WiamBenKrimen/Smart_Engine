package com.smartengine.process.controller;

import com.smartengine.process.dto.ProcessCreateRequest;
import com.smartengine.process.dto.ProcessResponse;
import com.smartengine.process.dto.ProcessValidationResult;
import com.smartengine.process.service.ProcessService;
import com.smartengine.workflow.entity.WorkflowStatut;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/processes")
public class ProcessController {

    private final ProcessService processService;

    public ProcessController(ProcessService processService) {
        this.processService = processService;
    }

    @GetMapping
    public List<ProcessResponse> list() {
        return processService.list();
    }

    @GetMapping("/{id}")
    public ProcessResponse get(@PathVariable("id") Long id) {
        return processService.get(id);
    }

    @PostMapping
    public ResponseEntity<ProcessResponse> create(@Valid @RequestBody ProcessCreateRequest request, Principal user) {
        String email = user != null ? user.getName() : "system";
        return ResponseEntity.ok(processService.createOrPublish(request, email));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProcessResponse> update(@PathVariable("id") Long id, @Valid @RequestBody ProcessCreateRequest request, Principal user) {
        String email = user != null ? user.getName() : "system";
        return ResponseEntity.ok(processService.createOrPublish(request, email));
    }

    @PostMapping("/{id}/publish")
    public ProcessResponse publish(@PathVariable("id") Long id) {
        return processService.updateStatus(id, WorkflowStatut.PUBLIE);
    }

    @PostMapping("/{id}/archive")
    public ProcessResponse archive(@PathVariable("id") Long id) {
        return processService.updateStatus(id, WorkflowStatut.ARCHIVE);
    }

    @PostMapping("/validate")
    public ProcessValidationResult validate(@RequestBody ProcessCreateRequest request) {
        return processService.validate(request);
    }
}
