package com.teamcrm.controller;

import com.teamcrm.dto.ChecklistDtos.*;
import com.teamcrm.dto.TaskDtos.*;
import com.teamcrm.security.UserDetailsImpl;
import com.teamcrm.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public ResponseEntity<List<TaskResponseDto>> getTasks(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long assigneeId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority) {
        return ResponseEntity.ok(taskService.getTasks(projectId, assigneeId, status, priority, currentUser));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskResponseDto> getTaskById(@PathVariable Long id) {
        return ResponseEntity.ok(taskService.getTaskById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('TASK_CREATE') or hasRole('ADMIN')")
    public ResponseEntity<TaskResponseDto> createTask(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @Valid @RequestBody CreateTaskRequest request) {
        return ResponseEntity.ok(taskService.createTask(request, currentUser != null ? currentUser.getId() : 1L));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TaskResponseDto> updateStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @Valid @RequestBody UpdateStatusRequest request) {
        return ResponseEntity.ok(taskService.updateTaskStatus(id, request.status(), currentUser != null ? currentUser.getId() : 1L));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('TASK_EDIT') or hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<TaskResponseDto> updateTask(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestBody UpdateTaskRequest request) {
        return ResponseEntity.ok(taskService.updateTask(id, request, currentUser != null ? currentUser.getId() : 1L));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('TASK_DELETE') or hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> deleteTask(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        taskService.deleteTask(id, currentUser != null ? currentUser.getId() : 1L);
        return ResponseEntity.ok().body("Task deleted successfully");
    }

    // Checklist
    @GetMapping("/{id}/checklist")
    public ResponseEntity<List<ChecklistItemResponse>> getChecklist(@PathVariable Long id) {
        return ResponseEntity.ok(taskService.getTaskChecklist(id));
    }

    @PostMapping("/{id}/checklist")
    public ResponseEntity<ChecklistItemResponse> addChecklistItem(
            @PathVariable Long id,
            @RequestBody ChecklistItemRequest request) {
        return ResponseEntity.ok(taskService.addChecklistItem(id, request));
    }

    @PatchMapping("/checklist/{itemId}/toggle")
    public ResponseEntity<ChecklistItemResponse> toggleChecklistItem(
            @PathVariable Long itemId,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(taskService.toggleChecklistItem(itemId, currentUser != null ? currentUser.getId() : 1L));
    }

    @DeleteMapping("/checklist/{itemId}")
    public ResponseEntity<?> deleteChecklistItem(@PathVariable Long itemId) {
        taskService.deleteChecklistItem(itemId);
        return ResponseEntity.noContent().build();
    }
}
