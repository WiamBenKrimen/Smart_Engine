package com.smartengine.workflow.controller;

import com.smartengine.workflow.dto.WorkflowRequest;
import com.smartengine.workflow.dto.WorkflowResponse;
import com.smartengine.workflow.dto.WorkflowValidationResult;
import com.smartengine.workflow.service.WorkflowService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/workflows")
public class WorkflowController {

    private final WorkflowService workflowService;

    public WorkflowController(WorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @GetMapping
    public List<WorkflowResponse> list() {
        return workflowService.list();
    }

    @GetMapping("/{id}")
    public WorkflowResponse get(@PathVariable("id") Long id) {
        return workflowService.get(id);
    }

    @PostMapping
    public ResponseEntity<WorkflowResponse> create(@Valid @RequestBody WorkflowRequest request) {
        return ResponseEntity.ok(workflowService.save(null, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkflowResponse> update(@PathVariable("id") Long id, @Valid @RequestBody WorkflowRequest request) {
        return ResponseEntity.ok(workflowService.save(id, request));
    }

    @PostMapping("/validate")
    public WorkflowValidationResult validate(@RequestBody WorkflowRequest request) {
        return workflowService.validate(request);
    }
}
