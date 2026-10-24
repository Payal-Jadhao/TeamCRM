package com.teamcrm.service;

import com.teamcrm.dto.AuthDtos.*;
import com.teamcrm.entity.Permission;
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

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AuthService.class);

    private record OtpEntry(String otp, Instant expiresAt, Instant createdAt, int attempts) {}
    private final Map<String, OtpEntry> otpCache = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();

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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (!passwordEncoder.matches(request.oldPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password does not match");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setIsFirstLogin(false);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
    }

    public UserProfileDto getCurrentUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

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
                user.getInitialPassword() != null ? user.getInitialPassword() : "••••••"
        );
    }

    public SendOtpResponse sendForgotPasswordOtp(SendOtpRequest request) {
        String email = request.email().toLowerCase().trim();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                        "Your email is not registered. Contact admin."));

        if (user.getIsActive() != null && !user.getIsActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, 
                    "Your account has been deactivated. Please contact your administrator.");
        }

        // Resend cooldown: 60 seconds
        OtpEntry existing = otpCache.get(email);
        if (existing != null && Instant.now().isBefore(existing.createdAt().plusSeconds(60))) {
            long remaining = Duration.between(Instant.now(), existing.createdAt().plusSeconds(60)).getSeconds();
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, 
                    "Please wait " + Math.max(1, remaining) + " seconds before requesting a new verification code.");
        }

        // Cryptographically secure 6-digit OTP
        int code = 100000 + secureRandom.nextInt(900000);
        String otp = String.valueOf(code);

        // Store with 10-minute validity, initialized with 0 failed attempts
        otpCache.put(email, new OtpEntry(otp, Instant.now().plus(Duration.ofMinutes(10)), Instant.now(), 0));

        // Dispatch email via JavaMailSender
        boolean emailSent = false;
        try {
            emailService.sendOtpEmail(email, otp);
            emailSent = true;
        } catch (Exception e) {
            log.warn("Gmail SMTP delivery not active: {}. Providing verification code fallback.", e.getMessage());
        }

        String msg;
        String returnedOtp;
        if (emailSent) {
            msg = "A 6-digit verification code has been dispatched to your registered email. Please check your inbox.";
            returnedOtp = null;
        } else {
            msg = "Verification code generated: " + otp + ". Please enter this 6-digit code below to set your new password.";
            returnedOtp = otp;
        }

        return new SendOtpResponse(true, msg, returnedOtp);
    }

    @Transactional
    public void verifyAndResetPassword(VerifyResetPasswordRequest request) {
        String email = request.email().toLowerCase().trim();
        OtpEntry entry = otpCache.get(email);

        if (entry == null || Instant.now().isAfter(entry.expiresAt())) {
            otpCache.remove(email);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Invalid or expired OTP. Please request a new verification code.");
        }

        if (!entry.otp().equals(request.otp().trim())) {
            int newAttempts = entry.attempts() + 1;
            if (newAttempts >= 5) {
                otpCache.remove(email);
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                        "Too many failed attempts. This OTP has been invalidated. Please request a new one.");
            } else {
                otpCache.put(email, new OtpEntry(entry.otp(), entry.expiresAt(), entry.createdAt(), newAttempts));
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                        "Incorrect OTP verification code. (" + (5 - newAttempts) + " attempts remaining)");
            }
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, 
                        "This email address does not exist in our system."));

        if (request.oldPassword() != null && !request.oldPassword().isBlank()) {
            if (!passwordEncoder.matches(request.oldPassword(), user.getPasswordHash())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                        "The old password entered does not match your current password.");
            }
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setIsFirstLogin(false);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        // Single-use: remove immediately
        otpCache.remove(email);
    }

    public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
        String email = request.email().toLowerCase().trim();

        // 1. Must be pre-registered in the database. Never auto-create.
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, 
                        "This email is not registered. Contact admin."));

        // 2. Must be active
        if (user.getIsActive() != null && !user.getIsActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, 
                    "Your TeamCRM account has been deactivated. Please contact your administrator.");
        }

        // 3. Authenticate with verified database role
        String roleName = user.getRole() != null ? user.getRole().getName() : "ROLE_EMPLOYEE";
        String jwt = jwtUtils.generateAccessToken(user.getEmail(), roleName, user.getId());
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
                roleName,
                user.getTeamTag(),
                user.getIsFirstLogin(),
                permissions
        );
    }
}
