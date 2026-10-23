package com.teamcrm.service;

import com.teamcrm.dto.AuthDtos.*;
import com.teamcrm.entity.AuditLog;
import com.teamcrm.entity.Permission;
import com.teamcrm.entity.Role;
import com.teamcrm.entity.User;
import com.teamcrm.repository.AuditLogRepository;
import com.teamcrm.repository.PermissionRepository;
import com.teamcrm.repository.RoleRepository;
import com.teamcrm.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogRepository auditLogRepository;

    public UserService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       PermissionRepository permissionRepository,
                       PasswordEncoder passwordEncoder,
                       AuditLogRepository auditLogRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogRepository = auditLogRepository;
    }

    public List<UserProfileDto> getAllUsers() {
        return userRepository.findAll().stream()
                .filter(u -> u.getEmail() == null || !u.getEmail().contains(".deleted."))
                .map(u -> {
            Set<String> perms = new HashSet<>();
            if (u.getRole() != null) {
                perms.add(u.getRole().getName());
                if (u.getRole().getPermissions() != null) {
                    u.getRole().getPermissions().forEach(p -> perms.add(p.getCode()));
                }
            }
            if (u.getExtraPermissions() != null) {
                u.getExtraPermissions().forEach(p -> perms.add(p.getCode()));
            }
            return new UserProfileDto(
                    u.getId(),
                    u.getEmail(),
                    u.getFullName(),
                    u.getRole() != null ? u.getRole().getName() : "ROLE_EMPLOYEE",
                    u.getTeamTag(),
                    u.getPhone(),
                    u.getAvatarUrl(),
                    u.getIsActive(),
                    u.getIsFirstLogin(),
                    perms,
                    u.getInitialPassword() != null ? u.getInitialPassword() : (u.getEmail().equalsIgnoreCase("payaldjadhao@gmail.com") ? "1234" : "••••••")
            );
        }).collect(Collectors.toList());
    }

    @Transactional
    public UserProfileDto createUser(CreateUserRequest request, Long creatorId) {
        if (userRepository.existsByEmail(request.email().toLowerCase().trim())) {
            throw new IllegalArgumentException("Email already in use");
        }

        Role role = roleRepository.findByName(request.roleName())
                .orElseGet(() -> roleRepository.findByName("ROLE_EMPLOYEE")
                        .orElseThrow(() -> new RuntimeException("Default role not found")));

        User user = new User();
        user.setEmail(request.email().toLowerCase().trim());
        String initialPassword = request.tempPassword() != null && !request.tempPassword().isBlank()
                ? request.tempPassword() : "Welcome123!";
        user.setPasswordHash(passwordEncoder.encode(initialPassword));
        user.setFullName(request.fullName());
        user.setRole(role);
        user.setTeamTag(request.teamTag() != null ? request.teamTag().toUpperCase() : "FRONTEND");
        user.setPhone(request.phone());
        user.setIsActive(true);
        user.setIsFirstLogin(true); // Mandatory password change on first login
        user.setInitialPassword(initialPassword);
        user.setCreatedBy(creatorId);

        if (request.extraPermissions() != null && !request.extraPermissions().isEmpty()) {
            Set<Permission> extras = new HashSet<>();
            for (String code : request.extraPermissions()) {
                permissionRepository.findByCode(code).ifPresent(extras::add);
            }
            user.setExtraPermissions(extras);
        }

        User saved = userRepository.save(user);

        // Audit log
        auditLogRepository.save(new AuditLog(
                creatorId, null, "USER_CREATE", "USER",
                saved.getId().toString(), null, "Created user " + saved.getEmail()
        ));

        return getUserById(saved.getId());
    }

    @Transactional
    public void toggleActiveStatus(Long userId, Long actorId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        boolean oldVal = user.getIsActive();
        user.setIsActive(!oldVal);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        auditLogRepository.save(new AuditLog(
                actorId, null, "USER_STATUS_TOGGLE", "USER",
                user.getId().toString(), String.valueOf(oldVal), String.valueOf(!oldVal)
        ));
    }

    @Transactional
    public void updateUserPermissions(Long userId, List<String> permissionCodes, Long actorId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Set<Permission> permissions = new HashSet<>();
        if (permissionCodes != null) {
            for (String code : permissionCodes) {
                permissionRepository.findByCode(code).ifPresent(permissions::add);
            }
        }
        user.setExtraPermissions(permissions);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        auditLogRepository.save(new AuditLog(
                actorId, null, "USER_PERMISSIONS_UPDATE", "USER",
                user.getId().toString(), null, "Updated permissions for " + user.getEmail()
        ));
    }

    @Transactional
    public UserProfileDto updateUser(Long userId, UpdateUserRequest request, Long actorId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.fullName() != null && !request.fullName().isBlank()) {
            user.setFullName(request.fullName().trim());
        }
        if (request.email() != null && !request.email().isBlank()) {
            user.setEmail(request.email().toLowerCase().trim());
        }
        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password().trim()));
            user.setInitialPassword(request.password().trim());
        }
        if (request.teamTag() != null) {
            user.setTeamTag(request.teamTag().toUpperCase().trim());
        }
        if (request.phone() != null) {
            user.setPhone(request.phone().trim());
        }
        if (request.isActive() != null) {
            user.setIsActive(request.isActive());
        }
        if (request.roleName() != null && !request.roleName().isBlank()) {
            roleRepository.findByName(request.roleName().toUpperCase().trim()).ifPresent(user::setRole);
        }
        if (request.extraPermissions() != null) {
            Set<Permission> extras = new HashSet<>();
            for (String code : request.extraPermissions()) {
                permissionRepository.findByCode(code).ifPresent(extras::add);
            }
            user.setExtraPermissions(extras);
        }

        user.setUpdatedAt(Instant.now());
        User saved = userRepository.save(user);

        auditLogRepository.save(new AuditLog(
                actorId, null, "USER_UPDATE", "USER",
                saved.getId().toString(), null, "Updated user " + saved.getEmail()
        ));

        return getUserById(saved.getId());
    }

    @Transactional
    public void deleteUser(Long userId, Long actorId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String oldEmail = user.getEmail();
        user.setIsActive(false);
        user.setEmail(oldEmail + ".deleted." + System.currentTimeMillis());
        userRepository.save(user);

        auditLogRepository.save(new AuditLog(
                actorId, null, "USER_DELETE", "USER",
                userId.toString(), oldEmail, "Deleted user " + oldEmail
        ));
    }

    public List<Permission> getAllPermissions() {
        return permissionRepository.findAll();
    }

    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    public UserProfileDto getUserById(Long id) {
        User u = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        Set<String> perms = new HashSet<>();
        if (u.getRole() != null) {
            perms.add(u.getRole().getName());
            if (u.getRole().getPermissions() != null) {
                u.getRole().getPermissions().forEach(p -> perms.add(p.getCode()));
            }
        }
        if (u.getExtraPermissions() != null) {
            u.getExtraPermissions().forEach(p -> perms.add(p.getCode()));
        }
        return new UserProfileDto(
                u.getId(),
                u.getEmail(),
                u.getFullName(),
                u.getRole() != null ? u.getRole().getName() : "ROLE_EMPLOYEE",
                u.getTeamTag(),
                u.getPhone(),
                u.getAvatarUrl(),
                u.getIsActive(),
                u.getIsFirstLogin(),
                perms,
                u.getInitialPassword() != null ? u.getInitialPassword() : "Password123!"
        );
    }
}
