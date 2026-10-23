package com.teamcrm.service;

import com.teamcrm.dto.AuthDtos.*;
import com.teamcrm.entity.Permission;
import com.teamcrm.entity.Role;
import com.teamcrm.entity.User;
import com.teamcrm.repository.RoleRepository;
import com.teamcrm.repository.UserRepository;
import com.teamcrm.security.JwtUtils;
import com.teamcrm.security.UserDetailsImpl;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.HashSet;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private record OtpEntry(String otp, Instant expiresAt) {}
    private final Map<String, OtpEntry> otpCache = new ConcurrentHashMap<>();

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final EmailService emailService;

    public AuthService(AuthenticationManager authenticationManager,
                       UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtils jwtUtils,
                       EmailService emailService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
        this.emailService = emailService;
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email().toLowerCase().trim(), request.password())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        String jwt = jwtUtils.generateAccessToken(userDetails.getUsername(), userDetails.getRoleName(), userDetails.getId());
        String refreshToken = jwtUtils.generateRefreshToken(userDetails.getUsername());

        Set<String> permissions = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());

        return new AuthResponse(
                jwt,
                refreshToken,
                "Bearer",
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getFullName(),
                userDetails.getRoleName(),
                userDetails.getTeamTag(),
                userDetails.getIsFirstLogin(),
                permissions
        );
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.oldPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password does not match");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setIsFirstLogin(false);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
    }

    public UserProfileDto getCurrentUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Set<String> permissions = new HashSet<>();
        if (user.getRole() != null) {
            permissions.add(user.getRole().getName());
            if (user.getRole().getPermissions() != null) {
                user.getRole().getPermissions().forEach(p -> permissions.add(p.getCode()));
            }
        }
        if (user.getExtraPermissions() != null) {
            user.getExtraPermissions().forEach(p -> permissions.add(p.getCode()));
        }

        return new UserProfileDto(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole() != null ? user.getRole().getName() : "ROLE_EMPLOYEE",
                user.getTeamTag(),
                user.getPhone(),
                user.getAvatarUrl(),
                user.getIsActive(),
                user.getIsFirstLogin(),
                permissions,
                user.getInitialPassword() != null ? user.getInitialPassword() : "Password123!"
        );
    }

    public SendOtpResponse sendForgotPasswordOtp(SendOtpRequest request) {
        String email = request.email().toLowerCase().trim();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "This email address does not exist in our system. Please check your registered email."));

        if (user.getIsActive() != null && !user.getIsActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your account has been deactivated. Please contact your administrator.");
        }

        String otp = String.format("%06d", new Random().nextInt(900000) + 100000);
        otpCache.put(email, new OtpEntry(otp, Instant.now().plus(Duration.ofMinutes(10))));

        // Send OTP directly to user's registered email inbox
        emailService.sendOtpEmail(email, otp);

        return new SendOtpResponse(true, "A 6-digit verification code has been sent to your email address (" + email + "). Please check your inbox.");
    }

    @Transactional
    public void verifyAndResetPassword(VerifyResetPasswordRequest request) {
        String email = request.email().toLowerCase().trim();
        OtpEntry entry = otpCache.get(email);
        if (entry == null || Instant.now().isAfter(entry.expiresAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired OTP. Please request a new verification code.");
        }
        if (!entry.otp().equals(request.otp().trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Incorrect OTP verification code. Please check the 6-digit code.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "This email address does not exist in our system."));

        if (request.oldPassword() != null && !request.oldPassword().isBlank()) {
            if (!passwordEncoder.matches(request.oldPassword(), user.getPasswordHash())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The old password entered does not match your current password.");
            }
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setIsFirstLogin(false);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        otpCache.remove(email);
    }

    public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
        String email = request.email().toLowerCase().trim();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "You are not registered in TeamCRM. Please contact your administrator."));

        if (!user.getIsActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your TeamCRM account has been deactivated. Please contact your administrator.");
        }

        String jwt = jwtUtils.generateAccessToken(user.getEmail(), user.getRole().getName(), user.getId());
        String refreshToken = jwtUtils.generateRefreshToken(user.getEmail());

        Set<String> permissions = new HashSet<>();
        if (user.getRole() != null) {
            permissions.add(user.getRole().getName());
            if (user.getRole().getPermissions() != null) {
                permissions.addAll(user.getRole().getPermissions().stream().map(Permission::getCode).collect(Collectors.toSet()));
            }
        }
        if (user.getExtraPermissions() != null) {
            permissions.addAll(user.getExtraPermissions().stream().map(Permission::getCode).collect(Collectors.toSet()));
        }

        return new AuthResponse(
                jwt,
                refreshToken,
                "Bearer",
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole().getName(),
                user.getTeamTag(),
                user.getIsFirstLogin(),
                permissions
        );
    }
}
