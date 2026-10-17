package com.smartengine.process.controller;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.smartengine.process.dto.ProcessDraftRequest;
import com.smartengine.process.service.ProcessDraftService;
import jakarta.validation.Valid;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/process-drafts") @RequiredArgsConstructor
public class ProcessDraftController {
    private final ProcessDraftService service;
    @GetMapping("/latest")
    public ResponseEntity<ObjectNode> latest(Principal user) {
        var result = service.latest(user.getName());
        return result == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(result);
    }
    @GetMapping("/{id}")
    public ObjectNode get(@PathVariable Long id, Principal user) { return service.get(id, user.getName()); }
    @PostMapping
    public ObjectNode create(@Valid @RequestBody ProcessDraftRequest request, Principal user) { return service.save(null, user.getName(), request); }
    @PutMapping("/{id}")
    public ObjectNode update(@PathVariable Long id, @Valid @RequestBody ProcessDraftRequest request, Principal user) { return service.save(id, user.getName(), request); }
}
