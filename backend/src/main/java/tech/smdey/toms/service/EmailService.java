package tech.smdey.toms.service;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;


@Service
public class EmailService {
    
    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private SpringTemplateEngine templateEngine;

    @Value("${app.base-url}")
    private String baseUrl;

    public void sendVerificationEmail(String to, String token){
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("TOMS - Verify your email");
        message.setText("Click the link to activate your account:\n\n" + baseUrl + "/api/v1/auth/verify?token=" + token);
        mailSender.send(message);
    }

    public void sendEmail(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }

    public void sendHtmlEmail(String to, String subject, String templateName, Map<String, Object> variables) {
        Context context = new Context();
        context.setVariables(variables);
        String body = templateEngine.process("email/" + templateName, context);
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true);
            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send HTML email", e);
        }
    }

}
