package com.teamcrm.controller;

import com.teamcrm.dto.AuthDtos.*;
import com.teamcrm.entity.Permission;
import com.teamcrm.entity.Role;
import com.teamcrm.security.UserDetailsImpl;
import com.teamcrm.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<UserProfileDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserProfileDto> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('USER_CREATE') or hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<UserProfileDto> createUser(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.ok(userService.createUser(request, currentUser != null ? currentUser.getId() : 1L));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_CREATE') or hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<UserProfileDto> updateUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateUser(id, request, currentUser != null ? currentUser.getId() : 1L));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_DEACTIVATE') or hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> deleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        userService.deleteUser(id, currentUser != null ? currentUser.getId() : 1L);
        return ResponseEntity.ok().body("User deleted successfully");
    }

    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasAuthority('USER_DEACTIVATE') or hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> toggleUserStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        userService.toggleActiveStatus(id, currentUser != null ? currentUser.getId() : 1L);
        return ResponseEntity.ok().body("User status toggled successfully");
    }

    @PutMapping("/{id}/permissions")
    @PreAuthorize("hasAuthority('ROLE_MANAGE') or hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> updateUserPermissions(
            @PathVariable Long id,
            @RequestBody UpdateUserPermissionsRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        userService.updateUserPermissions(id, request.permissionCodes(), currentUser != null ? currentUser.getId() : 1L);
        return ResponseEntity.ok().body("Permissions updated successfully");
    }

    @GetMapping("/meta/permissions")
    public ResponseEntity<List<Permission>> getAllPermissions() {
        return ResponseEntity.ok(userService.getAllPermissions());
    }

    @GetMapping("/meta/roles")
    public ResponseEntity<List<Role>> getAllRoles() {
        return ResponseEntity.ok(userService.getAllRoles());
    }
}
