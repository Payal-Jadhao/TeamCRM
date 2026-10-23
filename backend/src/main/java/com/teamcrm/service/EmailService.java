package com.teamcrm.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:payaldjadhao@gmail.com}")
    private String fromEmail;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${resend.api-key:${RESEND_API_KEY:}}")
    private String resendApiKey;

    @Value("${brevo.api-key:${BREVO_API_KEY:}}")
    private String brevoApiKey;

    @jakarta.annotation.PostConstruct
    public void initApiKey() {
        java.io.File envFile = new java.io.File(".env");
        if (!envFile.exists()) {
            envFile = new java.io.File("backend/.env");
        }
        if (envFile.exists()) {
            try {
                for (String line : java.nio.file.Files.readAllLines(envFile.toPath())) {
                    String trimmed = line.trim();
                    if (trimmed.startsWith("RESEND_API_KEY=") && (resendApiKey == null || resendApiKey.isBlank())) {
                        this.resendApiKey = trimmed.substring("RESEND_API_KEY=".length()).trim();
                        log.info("Loaded RESEND_API_KEY securely from .env file");
                    } else if (trimmed.startsWith("BREVO_API_KEY=") && (brevoApiKey == null || brevoApiKey.isBlank())) {
                        this.brevoApiKey = trimmed.substring("BREVO_API_KEY=".length()).trim();
                        log.info("Loaded BREVO_API_KEY securely from .env file");
                    }
                }
            } catch (Exception ignored) {}
        }
    }

    public EmailService(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOtpEmail(String toEmail, String otp) {
        log.info("Dispatching Password Reset verification email to recipient: {}", toEmail);

        // 1. Try Brevo API (Supports ANY recipient globally without domain verification)
        if (sendViaBrevo(toEmail, otp)) {
            return;
        }

        // 2. Try Resend Cloud Email API
        if (sendViaResend(toEmail, otp)) {
            return;
        }

        // 2. Fallback to JavaMailSender (SMTP)
        if (mailSender != null && mailPassword != null && !mailPassword.isBlank()) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(toEmail);
                message.setSubject("TeamCRM - Password Reset Verification Code");
                message.setText(
                        "Hello,\n\n" +
                        "We received a request to reset your password for your TeamCRM account (" + toEmail + ").\n\n" +
                        "Your 6-digit verification code is:\n\n" +
                        "   " + otp + "\n\n" +
                        "This code will expire in 10 minutes.\n\n" +
                        "If you did not request this password reset, please ignore this email or contact your administrator immediately.\n\n" +
                        "Best regards,\n" +
                        "TeamCRM Security Team"
                );
                mailSender.send(message);
                log.info("Verification OTP email accepted by SMTP server for delivery to recipient.");
                return;
            } catch (MailAuthenticationException e) {
                log.error("SMTP Authentication failure: Please verify Gmail App Password.");
            } catch (MailSendException e) {
                log.error("SMTP delivery failure: Connection timed out or invalid recipient.");
            } catch (Exception e) {
                log.error("Unexpected error during SMTP dispatch: {}", e.getMessage());
            }
        }

        // If neither Resend nor SMTP could deliver
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Email delivery failed: Neither Resend API nor SMTP could dispatch the email.");
    }

    private boolean sendViaResend(String toEmail, String otp) {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            return false;
        }
        try {
            String jsonPayload = """
                {
                  "from": "TeamCRM <onboarding@resend.dev>",
                  "to": ["%s"],
                  "subject": "TeamCRM - Password Reset Verification Code",
                  "html": "<div style='font-family:Arial,sans-serif;padding:24px;max-width:520px;border:1px solid #e2e8f0;border-radius:16px;background:#ffffff;'><div style='text-align:center;margin-bottom:20px;'><div style='display:inline-block;width:44px;height:44px;line-height:44px;background:#7c3aed;color:#ffffff;font-size:20px;font-weight:bold;border-radius:12px;'>T</div><h2 style='color:#1e1b4b;margin:12px 0 4px 0;font-size:20px;'>TeamCRM Password Reset</h2><p style='color:#64748b;font-size:13px;margin:0;'>Verification Code Request</p></div><p style='color:#334155;font-size:14px;line-height:1.6;'>Hello,</p><p style='color:#334155;font-size:14px;line-height:1.6;'>You requested to reset your password for your TeamCRM account (<strong>%s</strong>). Use the verification code below to proceed:</p><div style='margin:24px 0;padding:16px;background:#f5f3ff;border:1px dashed #7c3aed;border-radius:12px;text-align:center;'><span style='font-family:monospace;font-size:28px;font-weight:bold;letter-spacing:6px;color:#6d28d9;'>%s</span></div><p style='color:#64748b;font-size:12px;line-height:1.5;'>This verification code is valid for <strong>10 minutes</strong> and can only be used once.<br>If you did not request this code, please ignore this email.</p><hr style='border:none;border-top:1px solid #f1f5f9;margin:20px 0;'><p style='color:#94a3b8;font-size:11px;text-align:center;margin:0;'>&copy; 2026 TeamCRM Enterprise. Secure Authentication Gateway.</p></div>"
                }
                """.formatted(toEmail, toEmail, otp);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + resendApiKey.trim())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Successfully dispatched OTP email via Resend API to: {}", toEmail);
                return true;
            } else {
                log.warn("Resend API returned status {}: {}", response.statusCode(), response.body());
                return false;
            }
        } catch (Exception e) {
            log.warn("Resend API dispatch failed: {}", e.getMessage());
            return false;
        }
    }

    private boolean sendViaBrevo(String toEmail, String otp) {
        if (brevoApiKey == null || brevoApiKey.isBlank()) {
            return false;
        }
        try {
            String jsonPayload = """
                {
                  "sender": { "name": "TeamCRM", "email": "payaljadhao2709@gmail.com" },
                  "to": [{ "email": "%s" }],
                  "subject": "TeamCRM - Password Reset Verification Code: %s",
                  "htmlContent": "<div style='font-family:Arial,sans-serif;padding:24px;max-width:520px;border:1px solid #e2e8f0;border-radius:16px;background:#ffffff;'><div style='text-align:center;margin-bottom:20px;'><div style='display:inline-block;width:44px;height:44px;line-height:44px;background:#7c3aed;color:#ffffff;font-size:20px;font-weight:bold;border-radius:12px;'>T</div><h2 style='color:#1e1b4b;margin:12px 0 4px 0;font-size:20px;'>TeamCRM Password Reset</h2><p style='color:#64748b;font-size:13px;margin:0;'>Verification Code Request</p></div><p style='color:#334155;font-size:14px;line-height:1.6;'>Hello,</p><p style='color:#334155;font-size:14px;line-height:1.6;'>You requested to reset your password for your TeamCRM account (<strong>%s</strong>). Use the verification code below to proceed:</p><div style='margin:24px 0;padding:16px;background:#f5f3ff;border:1px dashed #7c3aed;border-radius:12px;text-align:center;'><span style='font-family:monospace;font-size:28px;font-weight:bold;letter-spacing:6px;color:#6d28d9;'>%s</span></div><p style='color:#64748b;font-size:12px;line-height:1.5;'>This verification code is valid for <strong>10 minutes</strong> and can only be used once.<br>If you did not request this code, please ignore this email.</p><hr style='border:none;border-top:1px solid #f1f5f9;margin:20px 0;'><p style='color:#94a3b8;font-size:11px;text-align:center;margin:0;'>&copy; 2026 TeamCRM Enterprise. Secure Authentication Gateway.</p></div>"
                }
                """.formatted(toEmail, otp, toEmail, otp);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                    .header("api-key", brevoApiKey.trim())
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Successfully dispatched OTP email via Brevo API to: {}", toEmail);
                return true;
            } else {
                log.warn("Brevo API returned status {}: {}", response.statusCode(), response.body());
                return false;
            }
        } catch (Exception e) {
            log.warn("Brevo API dispatch failed: {}", e.getMessage());
            return false;
        }
    }
}
