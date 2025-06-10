package com.inventory.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.annotation.PostConstruct;
import java.util.Properties;

@Configuration
public class MailConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(MailConfig.class);
    
    @Value("${spring.mail.host:smtp.gmail.com}")
    private String mailHost;
    
    @Value("${spring.mail.port:587}")
    private int mailPort;
    
    @Value("${spring.mail.username:}")
    private String mailUsername;
    
    @Value("${spring.mail.password:}")
    private String mailPassword;
    
    @PostConstruct
    public void logMailConfiguration() {
        logger.info("=== MAIL CONFIGURATION DEBUG ===");
        logger.info("Mail Host: {}", mailHost);
        logger.info("Mail Port: {}", mailPort);
        logger.info("Mail Username: {}", mailUsername != null && !mailUsername.isEmpty() ? mailUsername : "NOT SET");
        logger.info("Mail Password: {}", mailPassword != null && !mailPassword.isEmpty() ? "***CONFIGURED***" : "NOT SET");
        
        if (mailUsername == null || mailUsername.isEmpty()) {
            logger.error("❌ MAIL_USERNAME is not configured! Email notifications will fail!");
        }
        
        if (mailPassword == null || mailPassword.isEmpty()) {
            logger.error("❌ MAIL_PASSWORD is not configured! Email notifications will fail!");
        }
        
        if (mailUsername != null && !mailUsername.isEmpty() && mailPassword != null && !mailPassword.isEmpty()) {
            logger.info("✅ Mail credentials are configured");
        }
        logger.info("==================================");
    }
    
    @Bean
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        
        mailSender.setHost(mailHost);
        mailSender.setPort(mailPort);
        mailSender.setUsername(mailUsername);
        mailSender.setPassword(mailPassword);
        
        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.connectiontimeout", "5000");
        props.put("mail.smtp.timeout", "5000");
        props.put("mail.smtp.writetimeout", "5000");
        props.put("mail.debug", "true"); // Enable debug logging
        
        return mailSender;
    }
} 