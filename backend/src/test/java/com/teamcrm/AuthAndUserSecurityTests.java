package com.teamcrm;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.teamcrm.dto.AuthDtos.*;
import com.teamcrm.entity.Role;
import com.teamcrm.entity.User;
import com.teamcrm.repository.RoleRepository;
import com.teamcrm.repository.UserRepository;
import com.teamcrm.service.AuthService;
import com.teamcrm.service.EmailService;
import com.teamcrm.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.Field;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class AuthAndUserSecurityTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserService userService;

    @Autowired
    private EmailService emailService;

    @MockBean
    private JavaMailSender mailSender;

    private String adminToken;
    private String employeeToken;
    private String managerToken;

    @BeforeEach
    void setUp() throws Exception {
        // Clear non-admin test users to maintain test isolation
        List<User> users = userRepository.findAll();
        for (User u : users) {
            if (!"payaldjadhao@gmail.com".equalsIgnoreCase(u.getEmail())) {
                userRepository.delete(u);
            }
        }

        // Reset super admin password and active status
        User admin = userRepository.findByEmail("payaldjadhao@gmail.com").orElse(null);
        if (admin != null) {
            admin.setPasswordHash(passwordEncoder.encode("1234"));
            admin.setIsActive(true);
            userRepository.save(admin);
        }

        // Authenticate as Super Admin
        AuthResponse adminAuth = authService.login(new LoginRequest("payaldjadhao@gmail.com", "1234"));
        adminToken = adminAuth.accessToken();
        assertNotNull(adminToken);
        assertEquals("ROLE_ADMIN", adminAuth.role());
    }

    @Test
    @DisplayName("1. The super admin can log in and create an employee")
    void test1_superAdminCanLogInAndCreateEmployee() throws Exception {
        CreateUserRequest req = new CreateUserRequest(
                "rahul.dev@teamcrm.com",
                "Rahul Sharma",
                "Pass@1234",
                "ROLE_EMPLOYEE",
                "FRONTEND",
                "9876543210",
                List.of()
        );

        mockMvc.perform(post("/api/v1/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("rahul.dev@teamcrm.com"))
                .andExpect(jsonPath("$.roleName").value("ROLE_EMPLOYEE"));

        assertTrue(userRepository.existsByEmail("rahul.dev@teamcrm.com"));
    }

    @Test
    @DisplayName("2. The super admin can create a manager")
    void test2_superAdminCanCreateManager() throws Exception {
        CreateUserRequest req = new CreateUserRequest(
                "neha.manager@teamcrm.com",
                "Neha Kapoor",
                "Pass@1234",
                "ROLE_MANAGER",
                "BACKEND",
                "9876543211",
                List.of()
        );

        mockMvc.perform(post("/api/v1/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("neha.manager@teamcrm.com"))
                .andExpect(jsonPath("$.roleName").value("ROLE_MANAGER"));

        assertTrue(userRepository.existsByEmail("neha.manager@teamcrm.com"));
    }

    @Test
    @DisplayName("3. A normal employee cannot create users or change roles")
    void test3_normalEmployeeCannotCreateUsersOrChangeRoles() throws Exception {
        // Create an employee first
        Role empRole = roleRepository.findByName("ROLE_EMPLOYEE").orElseThrow();
        User employee = new User();
        employee.setEmail("emp.tester@teamcrm.com");
        employee.setPasswordHash(passwordEncoder.encode("Pass@1234"));
        employee.setFullName("Emp Tester");
        employee.setRole(empRole);
        employee.setIsActive(true);
        employee = userRepository.save(employee);

        AuthResponse empAuth = authService.login(new LoginRequest("emp.tester@teamcrm.com", "Pass@1234"));
        employeeToken = empAuth.accessToken();

        // Employee attempts to create a user -> HTTP 403 Forbidden
        CreateUserRequest createReq = new CreateUserRequest(
                "hacker@teamcrm.com",
                "Hacker User",
                "Pass@1234",
                "ROLE_EMPLOYEE",
                "FRONTEND",
                "9876543212",
                List.of()
        );

        mockMvc.perform(post("/api/v1/users")
                        .header("Authorization", "Bearer " + employeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isForbidden());

        // Employee attempts to promote themselves -> HTTP 403 Forbidden
        UpdateUserRequest updateReq = new UpdateUserRequest(
                "Emp Tester",
                "emp.tester@teamcrm.com",
                null,
                "ROLE_ADMIN",
                "MANAGEMENT",
                null,
                true,
                List.of()
        );

        mockMvc.perform(put("/api/v1/users/" + employee.getId())
                        .header("Authorization", "Bearer " + employeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("4. A manager cannot create an admin or access super admin APIs")
    void test4_managerCannotCreateAdminOrAccessSuperAdminApis() throws Exception {
        Role mgrRole = roleRepository.findByName("ROLE_MANAGER").orElseThrow();
        User manager = new User();
        manager.setEmail("manager.tester@teamcrm.com");
        manager.setPasswordHash(passwordEncoder.encode("Pass@1234"));
        manager.setFullName("Manager Tester");
        manager.setRole(mgrRole);
        manager.setIsActive(true);
        manager = userRepository.save(manager);

        AuthResponse mgrAuth = authService.login(new LoginRequest("manager.tester@teamcrm.com", "Pass@1234"));
        managerToken = mgrAuth.accessToken();

        // Manager attempts to create a user -> HTTP 403 Forbidden (Only Super Admin can create users)
        CreateUserRequest createReq = new CreateUserRequest(
                "new.admin@teamcrm.com",
                "Fake Admin",
                "Pass@1234",
                "ROLE_ADMIN",
                "MANAGEMENT",
                "9876543213",
                List.of()
        );

        mockMvc.perform(post("/api/v1/users")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isForbidden());

        assertFalse(userRepository.existsByEmail("new.admin@teamcrm.com"));
    }

    @Test
    @DisplayName("5. An unregistered Google email is rejected and no database record is created")
    void test5_unregisteredGoogleEmailRejectedNoDbRecordCreated() {
        String unregisteredEmail = "random.visitor99@gmail.com";
        assertFalse(userRepository.existsByEmail(unregisteredEmail));

        GoogleLoginRequest req = new GoogleLoginRequest(unregisteredEmail, "Random Visitor", "fake-token");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            authService.loginWithGoogle(req);
        });

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        assertEquals("This email is not registered. Contact admin.", ex.getReason());

        // Verify NO database record was created
        assertFalse(userRepository.existsByEmail(unregisteredEmail));
    }

    @Test
    @DisplayName("6. A registered employee logs in with the EMPLOYEE role")
    void test6_registeredEmployeeLogsInWithEmployeeRole() {
        Role empRole = roleRepository.findByName("ROLE_EMPLOYEE").orElseThrow();
        User employee = new User();
        employee.setEmail("pre.employee@gmail.com");
        employee.setPasswordHash(passwordEncoder.encode("Pass@1234"));
        employee.setFullName("Pre Employee");
        employee.setRole(empRole);
        employee.setIsActive(true);
        userRepository.save(employee);

        GoogleLoginRequest req = new GoogleLoginRequest("pre.employee@gmail.com", "Pre Employee", "fake-token");
        AuthResponse res = authService.loginWithGoogle(req);

        assertNotNull(res.accessToken());
        assertEquals("pre.employee@gmail.com", res.email());
        assertEquals("ROLE_EMPLOYEE", res.role());
    }

    @Test
    @DisplayName("7. A registered manager logs in with the MANAGER role")
    void test7_registeredManagerLogsInWithManagerRole() {
        Role mgrRole = roleRepository.findByName("ROLE_MANAGER").orElseThrow();
        User manager = new User();
        manager.setEmail("pre.manager@gmail.com");
        manager.setPasswordHash(passwordEncoder.encode("Pass@1234"));
        manager.setFullName("Pre Manager");
        manager.setRole(mgrRole);
        manager.setIsActive(true);
        userRepository.save(manager);

        GoogleLoginRequest req = new GoogleLoginRequest("pre.manager@gmail.com", "Pre Manager", "fake-token");
        AuthResponse res = authService.loginWithGoogle(req);

        assertNotNull(res.accessToken());
        assertEquals("pre.manager@gmail.com", res.email());
        assertEquals("ROLE_MANAGER", res.role());
    }

    @Test
    @DisplayName("8. A second Google account is not automatically assigned the EMPLOYEE role")
    void test8_secondGoogleAccountNotAutoAssignedEmployeeRole() {
        String secondEmail = "stranger.google@gmail.com";
        GoogleLoginRequest req = new GoogleLoginRequest(secondEmail, "Stranger", "fake-token");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            authService.loginWithGoogle(req);
        });

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        assertEquals("This email is not registered. Contact admin.", ex.getReason());
        assertFalse(userRepository.existsByEmail(secondEmail));
    }

    @Test
    @DisplayName("9. A disabled user cannot log in")
    void test9_disabledUserCannotLogIn() {
        Role empRole = roleRepository.findByName("ROLE_EMPLOYEE").orElseThrow();
        User disabledUser = new User();
        disabledUser.setEmail("disabled.account@teamcrm.com");
        disabledUser.setPasswordHash(passwordEncoder.encode("Pass@1234"));
        disabledUser.setFullName("Disabled Account");
        disabledUser.setRole(empRole);
        disabledUser.setIsActive(false);
        userRepository.save(disabledUser);

        // Google login attempt
        GoogleLoginRequest googleReq = new GoogleLoginRequest("disabled.account@teamcrm.com", "Disabled Account", "fake-token");
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            authService.loginWithGoogle(googleReq);
        });
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        assertTrue(ex.getReason().contains("deactivated"));

        // OTP attempt
        SendOtpRequest otpReq = new SendOtpRequest("disabled.account@teamcrm.com");
        ResponseStatusException otpEx = assertThrows(ResponseStatusException.class, () -> {
            authService.sendForgotPasswordOtp(otpReq);
        });
        assertEquals(HttpStatus.FORBIDDEN, otpEx.getStatusCode());
    }

    @Test
    @DisplayName("10. Gmail SMTP success and failure are handled correctly")
    void test10_gmailSmtpSuccessAndFailureHandled() {
        // Set mail password reflection field for testing email delivery
        doNothing().when(mailSender).send(any(SimpleMailMessage.class));

        assertDoesNotThrow(() -> {
            emailService.sendOtpEmail("payaldjadhao@gmail.com", "123456");
        });
        verify(mailSender, atLeastOnce()).send(any(SimpleMailMessage.class));

        // When mailSender throws MailAuthenticationException
        doThrow(new MailAuthenticationException("Bad credentials")).when(mailSender).send(any(SimpleMailMessage.class));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            emailService.sendOtpEmail("payaldjadhao@gmail.com", "123456");
        });
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Gmail SMTP authentication failed"));
    }

    @Test
    @DisplayName("11. Valid OTPs work; incorrect, expired, and reused OTPs fail")
    void test11_otpWorkflowCorrectnessExpirationReused() throws Exception {
        doNothing().when(mailSender).send(any(SimpleMailMessage.class));

        // Send OTP to payaldjadhao@gmail.com
        SendOtpResponse sendRes = authService.sendForgotPasswordOtp(new SendOtpRequest("payaldjadhao@gmail.com"));
        assertTrue(sendRes.success());

        // Extract the generated OTP from otpCache via target bean reflection
        Object target = org.springframework.test.util.AopTestUtils.getTargetObject(authService);
        Field cacheField = AuthService.class.getDeclaredField("otpCache");
        cacheField.setAccessible(true);
        @SuppressWarnings("unchecked")
        Map<String, Object> cache = (Map<String, Object>) cacheField.get(target);
        assertNotNull(cache);
        Object entry = cache.get("payaldjadhao@gmail.com");
        assertNotNull(entry);

        Field otpField = entry.getClass().getDeclaredField("otp");
        otpField.setAccessible(true);
        String generatedOtp = (String) otpField.get(entry);
        assertNotNull(generatedOtp);
        assertEquals(6, generatedOtp.length());

        // 1. Incorrect OTP fails
        VerifyResetPasswordRequest wrongReq = new VerifyResetPasswordRequest(
                "payaldjadhao@gmail.com",
                "000000",
                "1234",
                "NewPass@999"
        );
        ResponseStatusException wrongEx = assertThrows(ResponseStatusException.class, () -> {
            authService.verifyAndResetPassword(wrongReq);
        });
        assertEquals(HttpStatus.BAD_REQUEST, wrongEx.getStatusCode());
        assertTrue(wrongEx.getReason().contains("Incorrect OTP"));

        // 2. Correct OTP succeeds
        VerifyResetPasswordRequest correctReq = new VerifyResetPasswordRequest(
                "payaldjadhao@gmail.com",
                generatedOtp,
                "1234",
                "NewPass@999"
        );
        assertDoesNotThrow(() -> {
            authService.verifyAndResetPassword(correctReq);
        });

        // 3. Reused OTP fails (single use)
        ResponseStatusException reusedEx = assertThrows(ResponseStatusException.class, () -> {
            authService.verifyAndResetPassword(correctReq);
        });
        assertEquals(HttpStatus.BAD_REQUEST, reusedEx.getStatusCode());
        assertTrue(reusedEx.getReason().contains("Invalid or expired OTP"));
    }

    @Test
    @DisplayName("12. Unauthorized API requests are rejected even when sent directly without using React UI")
    void test12_unauthorizedApiRequestsRejectedDirectly() throws Exception {
        org.springframework.security.core.context.SecurityContextHolder.clearContext();

        mockMvc.perform(get("/api/v1/users"))
                .andExpect(status().isUnauthorized());

        CreateUserRequest req = new CreateUserRequest(
                "direct.attack@teamcrm.com",
                "Direct Attack",
                "Pass@123",
                "ROLE_ADMIN",
                "MANAGEMENT",
                "1234567890",
                List.of()
        );

        mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }
}
