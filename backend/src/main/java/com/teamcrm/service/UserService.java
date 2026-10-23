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
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserService {

    public static final String SUPER_ADMIN_EMAIL = "payaldjadhao@gmail.com";

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
                            u.getInitialPassword() != null ? u.getInitialPassword() : (u.getEmail().equalsIgnoreCase(SUPER_ADMIN_EMAIL) ? "1234" : "••••••")
                    );
                }).collect(Collectors.toList());
    }

    @Transactional
    public UserProfileDto createUser(CreateUserRequest request, Long creatorId) {
        String normalizedEmail = request.email().toLowerCase().trim();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already in use by another account.");
        }

        // Only the single super admin account can have ROLE_ADMIN
        if ("ROLE_ADMIN".equalsIgnoreCase(request.roleName())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Cannot create an admin account. There is exactly one designated super admin.");
        }

        String targetRole = (request.roleName() != null && request.roleName().equalsIgnoreCase("ROLE_MANAGER")) 
                ? "ROLE_MANAGER" : "ROLE_EMPLOYEE";

        Role role = roleRepository.findByName(targetRole)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Target role not found"));

        User user = new User();
        user.setEmail(normalizedEmail);
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
                saved.getId().toString(), null, "Created user " + saved.getEmail() + " with role " + role.getName()
        ));

        return getUserById(saved.getId());
    }

    @Transactional
    public void toggleActiveStatus(Long userId, Long actorId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (SUPER_ADMIN_EMAIL.equalsIgnoreCase(user.getEmail())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "The super admin account cannot be deactivated.");
        }

        boolean oldVal = user.getIsActive() != null && user.getIsActive();
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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        boolean isSuperAdmin = SUPER_ADMIN_EMAIL.equalsIgnoreCase(user.getEmail());

        if (request.fullName() != null && !request.fullName().isBlank()) {
            user.setFullName(request.fullName().trim());
        }

        if (request.email() != null && !request.email().isBlank()) {
            String newEmail = request.email().toLowerCase().trim();
            if (isSuperAdmin && !newEmail.equalsIgnoreCase(SUPER_ADMIN_EMAIL)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "The super admin email cannot be changed.");
            }
            if (!newEmail.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(newEmail)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already in use by another account.");
            }
            user.setEmail(newEmail);
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
            if (isSuperAdmin && !request.isActive()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "The super admin account cannot be deactivated.");
            }
            user.setIsActive(request.isActive());
        }

        if (request.roleName() != null && !request.roleName().isBlank()) {
            String requestedRole = request.roleName().toUpperCase().trim();
            if ("ROLE_ADMIN".equalsIgnoreCase(requestedRole) && !isSuperAdmin) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                        "Cannot promote user to admin. There is exactly one designated super admin.");
            }
            if (isSuperAdmin && !"ROLE_ADMIN".equalsIgnoreCase(requestedRole)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, 
                        "The super admin role cannot be changed.");
            }
            roleRepository.findByName(requestedRole).ifPresent(user::setRole);
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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (SUPER_ADMIN_EMAIL.equalsIgnoreCase(user.getEmail())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "The super admin account cannot be deleted.");
        }

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
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

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
                u.getInitialPassword() != null ? u.getInitialPassword() : (u.getEmail().equalsIgnoreCase(SUPER_ADMIN_EMAIL) ? "1234" : "••••••")
        );
    }
}
