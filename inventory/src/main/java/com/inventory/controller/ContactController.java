package com.inventory.controller;

import com.inventory.dto.ContactFormRequest;
import com.inventory.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/contact")
public class ContactController {
    
    private static final Logger logger = LoggerFactory.getLogger(ContactController.class);
    
    @Autowired
    private EmailService emailService;
    
    @Value("${app.contact.notification-email:miaotingshuo@gmail.com}")
    private String notificationEmail;
    
    @PostMapping("/submit")
    public ResponseEntity<?> submitContactForm(@Valid @RequestBody ContactFormRequest contactForm) {
        try {
            logger.info("Received contact form submission from: {}", contactForm.getEmail());
            
            // Send email notification
            emailService.sendContactFormNotification(contactForm, notificationEmail);
            
            logger.info("Contact form submission processed successfully for: {}", contactForm.getEmail());
            
            return ResponseEntity.ok(Map.of(
                "message", "Contact form submitted successfully. We'll get back to you within 24 hours.",
                "status", "success"
            ));
            
        } catch (Exception e) {
            logger.error("Failed to process contact form submission", e);
            
            return ResponseEntity.status(500).body(Map.of(
                "message", "Failed to submit contact form. Please try again or contact us directly at " + notificationEmail,
                "status", "error"
            ));
        }
    }
    
    @GetMapping("/info")
    public ResponseEntity<?> getContactInfo() {
        return ResponseEntity.ok(Map.of(
            "email", notificationEmail,
            "company", "Smart Inventory Pro",
            "supportHours", "Monday - Friday, 9:00 AM - 5:00 PM PST"
        ));
    }
} 