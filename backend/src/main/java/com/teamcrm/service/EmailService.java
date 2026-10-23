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

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:payaldjadhao@gmail.com}")
    private String fromEmail;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    public EmailService(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOtpEmail(String toEmail, String otp) {
        log.info("Dispatching Password Reset verification email to recipient domain: {}", 
                toEmail.contains("@") ? toEmail.substring(toEmail.indexOf('@')) : "[redacted]");

        if (mailSender == null) {
            log.error("JavaMailSender bean is not configured in the application context.");
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                    "Email service is not configured. Please contact the administrator.");
        }

        if (mailPassword == null || mailPassword.isBlank()) {
            log.error("SMTP password (SPRING_MAIL_PASSWORD) is not configured. Email cannot be delivered.");
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                    "Email delivery failed: Gmail App Password is not configured on the server.");
        }

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
        } catch (MailAuthenticationException e) {
            log.error("SMTP Authentication failure while sending to {}: Please verify Gmail App Password and 2-Step Verification.", 
                    toEmail.contains("@") ? toEmail.substring(toEmail.indexOf('@')) : "[redacted]");
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                    "Failed to send email: Gmail SMTP authentication failed. Please verify the Gmail App Password.");
        } catch (MailSendException e) {
            log.error("SMTP delivery failure: Connection timed out or invalid recipient. Details: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                    "Failed to deliver email. Please check internet connection and SMTP configuration.");
        } catch (Exception e) {
            log.error("Unexpected error during mail dispatch: {}", e.getClass().getSimpleName());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                    "Failed to send verification email. Please try again later.");
        }
    }
}
