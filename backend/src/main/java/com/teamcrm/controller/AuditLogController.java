package com.teamcrm.controller;

import com.teamcrm.entity.AuditLog;
import com.teamcrm.repository.AuditLogRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/audit")
@PreAuthorize("hasAuthority('AUDIT_VIEW') or hasRole('ADMIN') or hasRole('MANAGER')")
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    public AuditLogController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping
    public ResponseEntity<List<AuditLog>> getAuditLogs(
            @RequestParam(required = false) String entityName,
            @RequestParam(required = false) Long actorId) {

        if (entityName != null && !entityName.isBlank()) {
            return ResponseEntity.ok(auditLogRepository.findByEntityNameOrderByCreatedAtDesc(entityName));
        }
        if (actorId != null) {
            return ResponseEntity.ok(auditLogRepository.findByActorIdOrderByCreatedAtDesc(actorId));
        }
        return ResponseEntity.ok(auditLogRepository.findTop100ByOrderByCreatedAtDesc());
    }
}
