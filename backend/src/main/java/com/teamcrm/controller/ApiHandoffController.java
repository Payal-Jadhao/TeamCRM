package com.teamcrm.controller;

import com.teamcrm.dto.OtherDtos.*;
import com.teamcrm.security.UserDetailsImpl;
import com.teamcrm.service.ApiHandoffService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/api-docs")
public class ApiHandoffController {

    private final ApiHandoffService apiHandoffService;

    public ApiHandoffController(ApiHandoffService apiHandoffService) {
        this.apiHandoffService = apiHandoffService;
    }

    @GetMapping
    public ResponseEntity<List<ApiDocResponseDto>> getAllApiDocs() {
        return ResponseEntity.ok(apiHandoffService.getAllApiDocs());
    }

    @GetMapping("/task/{taskId}")
    public ResponseEntity<List<ApiDocResponseDto>> getTaskApiDocs(@PathVariable Long taskId) {
        return ResponseEntity.ok(apiHandoffService.getApiDocsByTaskId(taskId));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('API_DOC_PUBLISH') or hasRole('ADMIN') or hasRole('MANAGER') or hasRole('EMPLOYEE')")
    public ResponseEntity<ApiDocResponseDto> createApiDoc(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestBody CreateApiDocRequest request) {
        return ResponseEntity.ok(apiHandoffService.createApiDoc(request, currentUser.getId()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiDocResponseDto> updateStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestBody UpdateApiDocStatusRequest request) {
        return ResponseEntity.ok(apiHandoffService.updateStatus(id, request, currentUser.getId()));
    }
}
