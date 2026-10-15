package com.teamcrm.controller;

import com.teamcrm.dto.AuthDtos.*;
import com.teamcrm.security.UserDetailsImpl;
import com.teamcrm.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(userDetails.getId(), request);
        return ResponseEntity.ok().body("Password updated successfully");
    }

    @PostMapping("/forgot-password/send-otp")
    public ResponseEntity<SendOtpResponse> sendForgotPasswordOtp(@Valid @RequestBody SendOtpRequest request) {
        return ResponseEntity.ok(authService.sendForgotPasswordOtp(request));
    }

    @PostMapping("/forgot-password/verify-reset")
    public ResponseEntity<?> verifyAndResetPassword(@Valid @RequestBody VerifyResetPasswordRequest request) {
        authService.verifyAndResetPassword(request);
        return ResponseEntity.ok().body("Password reset successfully. You can now login with your new password.");
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> loginWithGoogle(@Valid @RequestBody GoogleLoginRequest request) {
        return ResponseEntity.ok(authService.loginWithGoogle(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileDto> getMe(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(authService.getCurrentUserProfile(userDetails.getId()));
    }
}
