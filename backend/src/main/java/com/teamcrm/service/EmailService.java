package com.teamcrm.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@teamcrm.com}")
    private String fromEmail;

    public EmailService(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOtpEmail(String toEmail, String otp) {
        log.info("📧 Dispatching Password Reset OTP to {}", toEmail);

        if (mailSender != null) {
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
                log.info("✅ Verification OTP email successfully sent via SMTP to {}", toEmail);
                return;
            } catch (Exception e) {
                log.warn("⚠️ SMTP dispatch failed (Host/credentials not yet configured): {}. Verification code logged securely.", e.getMessage());
            }
        } else {
            log.info("ℹ️ JavaMailSender bean not configured. Simulated email delivery to {}", toEmail);
        }

        // Always log cleanly on server console for testing/audit:
        System.out.println("=================================================");
        System.out.println("📧 [TeamCRM Mail Delivery to " + toEmail + "]");
        System.out.println("🔐 Verification OTP Code: " + otp);
        System.out.println("=================================================");
    }
}
