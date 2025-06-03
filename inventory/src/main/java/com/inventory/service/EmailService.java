package com.inventory.service;

import com.inventory.entity.Alert;
import com.inventory.dto.ContactFormRequest;

public interface EmailService {
    
    /**
     * Send alert notification email
     * @param alert The alert to send notification for
     * @param recipientEmail Email address to send to
     */
    void sendAlertNotification(Alert alert, String recipientEmail);
    
    /**
     * Send contact form submission email
     * @param contactForm The contact form data
     * @param recipientEmail Email address to send to
     */
    void sendContactFormNotification(ContactFormRequest contactForm, String recipientEmail);
    
    /**
     * Send welcome email to new users
     * @param userEmail User's email address
     * @param userName User's full name
     * @param temporaryPassword Temporary password if applicable
     */
    void sendWelcomeEmail(String userEmail, String userName, String temporaryPassword);
    
    /**
     * Send low stock summary email (daily/weekly reports)
     * @param recipientEmail Email address to send to
     * @param alertCount Number of active alerts
     */
    void sendLowStockSummary(String recipientEmail, long alertCount);
} 