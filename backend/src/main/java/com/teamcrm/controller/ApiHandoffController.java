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
    public ResponseEntity<List<ApiDocResponseDto>> getAllApiDocs(
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        if (currentUser == null) {
            return ResponseEntity.ok(List.of());
        }
        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return ResponseEntity.ok(apiHandoffService.getAllApiDocs(currentUser.getId(), isAdmin));
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

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('API_DOC_PUBLISH') or hasRole('ADMIN') or hasRole('MANAGER') or hasRole('EMPLOYEE')")
    public ResponseEntity<ApiDocResponseDto> updateApiDoc(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestBody UpdateApiDocRequest request) {
        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return ResponseEntity.ok(apiHandoffService.updateApiDoc(id, request, currentUser.getId(), isAdmin));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('API_DOC_PUBLISH') or hasRole('ADMIN') or hasRole('MANAGER') or hasRole('EMPLOYEE')")
    public ResponseEntity<Void> deleteApiDoc(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        apiHandoffService.deleteApiDoc(id, currentUser.getId(), isAdmin);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiDocResponseDto> updateStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestBody UpdateApiDocStatusRequest request) {
        return ResponseEntity.ok(apiHandoffService.updateStatus(id, request, currentUser.getId()));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<ApiDocCommentDto> addComment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestBody CreateApiDocCommentRequest request) {
        Long userId = currentUser != null ? currentUser.getId() : null;
        return ResponseEntity.ok(apiHandoffService.addComment(id, request, userId));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<ApiDocCommentDto>> getComments(@PathVariable Long id) {
        return ResponseEntity.ok(apiHandoffService.getComments(id));
    }
}
