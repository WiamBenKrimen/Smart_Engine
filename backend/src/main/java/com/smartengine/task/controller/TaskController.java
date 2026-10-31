package com.smartengine.task.controller;

import com.smartengine.task.dto.TaskDecisionRequest;
import com.smartengine.task.dto.TaskResponse;
import com.smartengine.task.service.TaskService;
import java.security.Principal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping("/mine")
    public ResponseEntity<List<TaskResponse>> listMine(Principal principal) {
        return ResponseEntity.ok(taskService.getTasksForUser(principal.getName()));
    }

    @GetMapping("/workspace/{workspaceId}")
    public ResponseEntity<List<TaskResponse>> listByWorkspace(@PathVariable("workspaceId") Long workspaceId) {
        return ResponseEntity.ok(taskService.getTasksByWorkspace(workspaceId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskResponse> getById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(taskService.getTaskById(id));
    }

    @PostMapping("/{id}/claim")
    public ResponseEntity<TaskResponse> claim(@PathVariable("id") Long id, Principal principal) {
        return ResponseEntity.ok(taskService.claimTask(id, principal.getName()));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<TaskResponse> approve(
        @PathVariable("id") Long id,
        @RequestBody(required = false) TaskDecisionRequest request,
        Principal principal
    ) {
        String comment = request != null ? request.comment() : null;
        return ResponseEntity.ok(taskService.approveTask(id, comment, principal.getName()));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<TaskResponse> reject(
        @PathVariable("id") Long id,
        @RequestBody(required = false) TaskDecisionRequest request,
        Principal principal
    ) {
        String comment = request != null ? request.comment() : null;
        return ResponseEntity.ok(taskService.rejectTask(id, comment, principal.getName()));
    }
}
