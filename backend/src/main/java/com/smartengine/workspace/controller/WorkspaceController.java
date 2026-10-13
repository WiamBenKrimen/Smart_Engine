package com.smartengine.workspace.controller;

import com.smartengine.workspace.dto.WorkspaceMemberRequest;
import com.smartengine.workspace.dto.WorkspaceRequest;
import com.smartengine.workspace.dto.WorkspaceResponse;
import com.smartengine.workspace.dto.WorkspaceStatusRequest;
import com.smartengine.workspace.dto.WorkspaceUserOptionResponse;
import com.smartengine.workspace.service.WorkspaceService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/workspaces")
@RequiredArgsConstructor
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    @GetMapping
    public ResponseEntity<List<WorkspaceResponse>> list() {
        return ResponseEntity.ok(workspaceService.list());
    }

    @GetMapping("/users")
    public ResponseEntity<List<WorkspaceUserOptionResponse>> listUsersForMembers() {
        return ResponseEntity.ok(workspaceService.listUsersForMembers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkspaceResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(workspaceService.getById(id));
    }

    @PostMapping
    public ResponseEntity<WorkspaceResponse> create(@Valid @RequestBody WorkspaceRequest request) {
        return ResponseEntity.ok(workspaceService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkspaceResponse> update(
        @PathVariable String id,
        @Valid @RequestBody WorkspaceRequest request
    ) {
        return ResponseEntity.ok(workspaceService.update(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<WorkspaceResponse> updateStatus(
        @PathVariable String id,
        @Valid @RequestBody WorkspaceStatusRequest request
    ) {
        return ResponseEntity.ok(workspaceService.updateStatus(id, request));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<WorkspaceResponse> addMember(
        @PathVariable String id,
        @Valid @RequestBody WorkspaceMemberRequest request
    ) {
        return ResponseEntity.ok(workspaceService.addMember(id, request));
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<WorkspaceResponse> removeMember(
        @PathVariable String id,
        @PathVariable Long userId
    ) {
        return ResponseEntity.ok(workspaceService.removeMember(id, userId));
    }
}
