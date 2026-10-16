package com.teamcrm.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.Set;

public class AuthDtos {

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password
    ) {}

    public record AuthResponse(
            String accessToken,
            String refreshToken,
            String tokenType,
            Long userId,
            String email,
            String fullName,
            String role,
            String teamTag,
            Boolean isFirstLogin,
            Set<String> permissions
    ) {}

    public record ChangePasswordRequest(
            @NotBlank String oldPassword,
            @NotBlank String newPassword
    ) {}

    public record CreateUserRequest(
            @NotBlank @Email String email,
            @NotBlank String fullName,
            String tempPassword,
            @NotBlank String roleName,
            String teamTag,
            String phone,
            List<String> extraPermissions
    ) {}

    public record UpdateUserPermissionsRequest(
            Long userId,
            List<String> permissionCodes
    ) {}

    public record UserProfileDto(
            Long id,
            String email,
            String fullName,
            String roleName,
            String teamTag,
            String phone,
            String avatarUrl,
            Boolean isActive,
            Boolean isFirstLogin,
            Set<String> permissions,
            String initialPassword
    ) {}

    public record UpdateUserRequest(
            String fullName,
            String email,
            String password,
            String roleName,
            String teamTag,
            String phone,
            Boolean isActive,
            List<String> extraPermissions
    ) {}

    public record SendOtpRequest(
            @NotBlank @Email String email
    ) {}

    public record SendOtpResponse(
            boolean success,
            String message
    ) {}

    public record VerifyResetPasswordRequest(
            @NotBlank @Email String email,
            @NotBlank String otp,
            String oldPassword,
            @NotBlank String newPassword
    ) {}

    public record GoogleLoginRequest(
            @NotBlank @Email String email,
            String fullName,
            String googleToken
    ) {}
}
