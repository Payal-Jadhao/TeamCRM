package com.teamcrm.controller;

import com.teamcrm.entity.MasterItem;
import com.teamcrm.repository.MasterRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/masters")
public class MasterController {

    private final MasterRepository masterRepository;

    public MasterController(MasterRepository masterRepository) {
        this.masterRepository = masterRepository;
    }

    @GetMapping
    public ResponseEntity<List<MasterItem>> getMasters(@RequestParam(required = false) String category) {
        if (category != null && !category.isBlank()) {
            return ResponseEntity.ok(masterRepository.findByCategoryAndIsDeletedFalseOrderBySortOrderAsc(category.trim().toUpperCase()));
        }
        return ResponseEntity.ok(masterRepository.findByIsDeletedFalseOrderByCategoryAscSortOrderAsc());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MasterItem> createMaster(@RequestBody Map<String, Object> payload) {
        MasterItem item = new MasterItem();
        item.setCategory(((String) payload.getOrDefault("category", "TEAM")).trim().toUpperCase());
        item.setName(((String) payload.getOrDefault("name", "")).trim());
        item.setKeyCode(((String) payload.getOrDefault("keyCode", "")).trim().toUpperCase());
        item.setSortOrder(payload.containsKey("sortOrder") ? ((Number) payload.get("sortOrder")).intValue() : 1);
        item.setIsActive(payload.containsKey("isActive") ? (Boolean) payload.get("isActive") : true);
        item.setIsDeleted(false);
        item.setCreatedAt(Instant.now());
        item.setUpdatedAt(Instant.now());
        return ResponseEntity.ok(masterRepository.save(item));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MasterItem> updateMaster(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        return masterRepository.findById(id).map(item -> {
            if (payload.containsKey("name")) item.setName(((String) payload.get("name")).trim());
            if (payload.containsKey("keyCode")) item.setKeyCode(((String) payload.get("keyCode")).trim().toUpperCase());
            if (payload.containsKey("sortOrder")) item.setSortOrder(((Number) payload.get("sortOrder")).intValue());
            if (payload.containsKey("isActive")) item.setIsActive((Boolean) payload.get("isActive"));
            item.setUpdatedAt(Instant.now());
            return ResponseEntity.ok(masterRepository.save(item));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MasterItem> toggleMasterActive(@PathVariable Long id) {
        return masterRepository.findById(id).map(item -> {
            item.setIsActive(!item.getIsActive());
            item.setUpdatedAt(Instant.now());
            return ResponseEntity.ok(masterRepository.save(item));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> softDeleteMaster(@PathVariable Long id) {
        return masterRepository.findById(id).map(item -> {
            item.setIsDeleted(true);
            item.setUpdatedAt(Instant.now());
            masterRepository.save(item);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
