package com.sncft.app.shared.notification;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Sends an OTP in email .
     */
    @Async
    public void sendOtpEmail(String to, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("SNCFT - Your Password Reset Code");
        message.setText("Your password reset code is: " + otp + "\n\nThis code will expire in 15 minutes.");
        message.setFrom("no-reply@sncft.com.tn");
        
        mailSender.send(message);
    }

    /**
     * Sends a welcome email with the generated password to a new staff member.
     */
    @Async
    public void sendStaffWelcomeEmail(String to, String name, String password) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("SNCFT - Vos identifiants de connexion");
        message.setText(
                "Votre compte professionnel SNCFT a été créé avec succès.\n" +
                "Voici votre mot de passe temporaire : " + password + "\n\n" +
                "Veuillez vous connecter et modifier votre mot de passe dès que possible."
                );
        message.setFrom("no-reply@sncft.com.tn");
        
        mailSender.send(message);
    }
}
