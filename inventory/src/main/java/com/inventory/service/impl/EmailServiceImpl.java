package com.inventory.service.impl;

import com.inventory.entity.Alert;
import com.inventory.dto.ContactFormRequest;
import com.inventory.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.mail.internet.MimeMessage;
import java.time.format.DateTimeFormatter;

@Service
public class EmailServiceImpl implements EmailService {
    
    private static final Logger logger = LoggerFactory.getLogger(EmailServiceImpl.class);
    
    @Autowired
    private JavaMailSender mailSender;
    
    @Value("${spring.mail.username}")
    private String fromEmail;
    
    private static final String COMPANY_NAME = "Smart Inventory Pro";
    private static final String SUPPORT_EMAIL = "miaotingshuo@gmail.com";
    
    @Override
    public void sendAlertNotification(Alert alert, String recipientEmail) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail, COMPANY_NAME);
            helper.setTo(recipientEmail);
            
            // Determine urgency and subject
            boolean isUrgent = isAlertUrgent(alert);
            String urgencyPrefix = isUrgent ? "🚨 URGENT" : "⚠️";
            String subject = String.format("%s Inventory Alert: %s - %s", 
                urgencyPrefix, alert.getItem().getName(), COMPANY_NAME);
            
            helper.setSubject(subject);
            helper.setText(buildAlertEmailTemplate(alert), true);
            
            mailSender.send(message);
            logger.info("Alert notification email sent successfully to: {}", recipientEmail);
            
        } catch (Exception e) {
            logger.error("Failed to send alert notification email to: {}", recipientEmail, e);
        }
    }
    
    @Override
    public void sendContactFormNotification(ContactFormRequest contactForm, String recipientEmail) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail, COMPANY_NAME);
            helper.setTo(recipientEmail);
            helper.setReplyTo(contactForm.getEmail());
            helper.setSubject("New Contact Form Submission - " + COMPANY_NAME);
            helper.setText(buildContactFormEmailTemplate(contactForm), true);
            
            mailSender.send(message);
            logger.info("Contact form notification email sent successfully to: {}", recipientEmail);
            
        } catch (Exception e) {
            logger.error("Failed to send contact form notification email to: {}", recipientEmail, e);
        }
    }
    
    @Override
    public void sendWelcomeEmail(String userEmail, String userName, String temporaryPassword) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail, COMPANY_NAME);
            helper.setTo(userEmail);
            helper.setSubject("Welcome to " + COMPANY_NAME);
            helper.setText(buildWelcomeEmailTemplate(userName, temporaryPassword), true);
            
            mailSender.send(message);
            logger.info("Welcome email sent successfully to: {}", userEmail);
            
        } catch (Exception e) {
            logger.error("Failed to send welcome email to: {}", userEmail, e);
        }
    }
    
    @Override
    public void sendLowStockSummary(String recipientEmail, long alertCount) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail, COMPANY_NAME);
            helper.setTo(recipientEmail);
            helper.setSubject("Daily Inventory Alert Summary - " + COMPANY_NAME);
            helper.setText(buildSummaryEmailTemplate(alertCount), true);
            
            mailSender.send(message);
            logger.info("Daily summary email sent successfully to: {}", recipientEmail);
            
        } catch (Exception e) {
            logger.error("Failed to send daily summary email to: {}", recipientEmail, e);
        }
    }
    
    private boolean isAlertUrgent(Alert alert) {
        // Consider alert urgent if current inventory is less than 20% of safety stock threshold
        int criticalLevel = (int) (alert.getSafetyStockThreshold() * 0.2);
        return alert.getCurrentInventory() <= criticalLevel;
    }
    
    private String buildAlertEmailTemplate(Alert alert) {
        boolean isUrgent = isAlertUrgent(alert);
        String urgencyColor = isUrgent ? "#ff4444" : "#ff9800";
        String urgencyLabel = isUrgent ? "URGENT" : "WARNING";
        
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Inventory Alert</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">📦 %s</h1>
                    <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">Inventory Management System</p>
                </div>
                
                <div style="background-color: %s; color: white; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 25px;">
                    <h2 style="margin: 0; font-size: 22px;">%s ALERT</h2>
                    <p style="margin: 5px 0 0 0; font-size: 16px;">Immediate attention required</p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
                    <h3 style="color: #333; margin-top: 0;">📋 Alert Details</h3>
                    <p><strong>Alert Type:</strong> %s</p>
                    <p><strong>Message:</strong> %s</p>
                    <p><strong>Generated:</strong> %s</p>
                </div>
                
                <div style="background-color: #fff; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; margin-bottom: 25px;">
                    <h3 style="background-color: #667eea; color: white; margin: 0; padding: 15px; font-size: 18px;">🏷️ Item Information</h3>
                    <table style="width: 100%%; border-collapse: collapse;">
                        <tr style="background-color: #f8f9fa;">
                            <td style="padding: 12px 15px; border-bottom: 1px solid #ddd; font-weight: bold;">Item Name</td>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #ddd;">%s</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #ddd; font-weight: bold;">Item Code</td>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #ddd;">%s</td>
                        </tr>
                        <tr style="background-color: #f8f9fa;">
                            <td style="padding: 12px 15px; border-bottom: 1px solid #ddd; font-weight: bold;">Location</td>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #ddd;">%s</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #ddd; font-weight: bold;">Barcode</td>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #ddd; font-family: monospace;">%s</td>
                        </tr>
                    </table>
                </div>
                
                <div style="background-color: #fff; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; margin-bottom: 25px;">
                    <h3 style="background-color: #28a745; color: white; margin: 0; padding: 15px; font-size: 18px;">📊 Current Inventory Status</h3>
                    <table style="width: 100%%; border-collapse: collapse;">
                        <tr style="background-color: #f8f9fa;">
                            <td style="padding: 12px 15px; border-bottom: 1px solid #ddd; font-weight: bold;">Current Inventory</td>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #ddd; color: %s; font-weight: bold;">%d units</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #ddd; font-weight: bold;">Used Inventory</td>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #ddd;">%d units</td>
                        </tr>
                        <tr style="background-color: #f8f9fa;">
                            <td style="padding: 12px 15px; border-bottom: 1px solid #ddd; font-weight: bold;">Pending Purchase Orders</td>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #ddd;">%d units</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #ddd; font-weight: bold;">Safety Stock Threshold</td>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #ddd;">%d units</td>
                        </tr>
                        <tr style="background-color: #fff3cd;">
                            <td style="padding: 12px 15px; font-weight: bold;">Effective Inventory</td>
                            <td style="padding: 12px 15px; font-weight: bold; color: %s;">%d units</td>
                        </tr>
                    </table>
                </div>
                
                <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                    <h3 style="color: #d68910; margin-top: 0;">⚡ Action Required</h3>
                    <p style="margin-bottom: 0;">Please review the inventory levels and consider placing a purchase order to restock this item.</p>
                </div>
                
                <div style="text-align: center; padding: 25px; background-color: #f8f9fa; border-radius: 8px;">
                    <p style="margin: 0; color: #666; font-size: 14px;">
                        This alert was generated automatically by %s<br>
                        For support, contact: <a href="mailto:%s" style="color: #667eea;">%s</a>
                    </p>
                </div>
            </body>
            </html>
            """,
            COMPANY_NAME, urgencyColor, urgencyLabel,
            alert.getAlertType(),
            alert.getMessage(),
            alert.getCreatedAt().format(DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' HH:mm")),
            alert.getItem().getName(),
            alert.getItem().getCode(),
            alert.getItem().getLocation() != null ? alert.getItem().getLocation() : "Not specified",
            alert.getItem().getBarcode() != null ? alert.getItem().getBarcode() : "Not specified",
            isUrgent ? "#dc3545" : "#fd7e14",
            alert.getCurrentInventory(),
            alert.getUsedInventory(),
            alert.getPendingPO(),
            alert.getSafetyStockThreshold(),
            isUrgent ? "#dc3545" : "#fd7e14",
            alert.getCurrentInventory() + alert.getPendingPO(),
            COMPANY_NAME, SUPPORT_EMAIL, SUPPORT_EMAIL
        );
    }
    
    private String buildContactFormEmailTemplate(ContactFormRequest contactForm) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Contact Form Submission</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">📧 %s</h1>
                    <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">New Contact Form Submission</p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
                    <h3 style="color: #333; margin-top: 0;">👤 Contact Information</h3>
                    <table style="width: 100%%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; width: 120px;">Name:</td>
                            <td style="padding: 8px 0;">%s</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Email:</td>
                            <td style="padding: 8px 0;"><a href="mailto:%s" style="color: #667eea;">%s</a></td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Company:</td>
                            <td style="padding: 8px 0;">%s</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Phone:</td>
                            <td style="padding: 8px 0;">%s</td>
                        </tr>
                    </table>
                </div>
                
                <div style="background-color: #fff; border: 1px solid #ddd; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
                    <h3 style="color: #333; margin-top: 0;">💬 Message</h3>
                    <p style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 0; white-space: pre-wrap;">%s</p>
                </div>
                
                <div style="text-align: center; padding: 25px; background-color: #f8f9fa; border-radius: 8px;">
                    <p style="margin: 0; color: #666; font-size: 14px;">
                        Submitted on: %s<br>
                        You can reply directly to this email to respond to the inquiry.
                    </p>
                </div>
            </body>
            </html>
            """,
            COMPANY_NAME,
            contactForm.getName(),
            contactForm.getEmail(), contactForm.getEmail(),
            contactForm.getCompany() != null ? contactForm.getCompany() : "Not provided",
            contactForm.getPhone() != null ? contactForm.getPhone() : "Not provided",
            contactForm.getMessage() != null ? contactForm.getMessage() : "No additional message provided",
            java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' HH:mm"))
        );
    }
    
    private String buildWelcomeEmailTemplate(String userName, String temporaryPassword) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to Smart Inventory Pro</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to %s!</h1>
                    <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">Your account has been created successfully</p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
                    <h3 style="color: #333; margin-top: 0;">👋 Hello %s,</h3>
                    <p>Welcome to Smart Inventory Pro! Your account has been successfully created and you can now access our powerful inventory management system.</p>
                </div>
                
                %s
                
                <div style="background-color: #fff; border: 1px solid #ddd; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
                    <h3 style="color: #333; margin-top: 0;">🚀 Getting Started</h3>
                    <ul style="margin: 0; padding-left: 20px;">
                        <li style="margin-bottom: 10px;">Add your first inventory items</li>
                        <li style="margin-bottom: 10px;">Set up safety stock thresholds</li>
                        <li style="margin-bottom: 10px;">Configure alert notifications</li>
                        <li style="margin-bottom: 10px;">Start tracking item usage</li>
                    </ul>
                </div>
                
                <div style="text-align: center; padding: 25px; background-color: #f8f9fa; border-radius: 8px;">
                    <p style="margin: 0; color: #666; font-size: 14px;">
                        Need help? Contact our support team: <a href="mailto:%s" style="color: #667eea;">%s</a><br>
                        Visit our documentation or reach out with any questions.
                    </p>
                </div>
            </body>
            </html>
            """,
            COMPANY_NAME, userName,
            temporaryPassword != null ? 
                String.format("""
                    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                        <h3 style="color: #d68910; margin-top: 0;">🔐 Login Credentials</h3>
                        <p><strong>Temporary Password:</strong> <code style="background-color: #f8f9fa; padding: 4px 8px; border-radius: 4px; font-family: monospace;">%s</code></p>
                        <p style="margin-bottom: 0; color: #856404;"><strong>Important:</strong> Please change your password after your first login for security.</p>
                    </div>
                    """, temporaryPassword) : "",
            SUPPORT_EMAIL, SUPPORT_EMAIL
        );
    }
    
    private String buildSummaryEmailTemplate(long alertCount) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Daily Inventory Summary</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">📊 %s</h1>
                    <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">Daily Inventory Summary</p>
                </div>
                
                <div style="background-color: %s; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 25px;">
                    <h2 style="margin: 0 0 10px 0; font-size: 36px;">%d</h2>
                    <p style="margin: 0; font-size: 18px;">Active Alert%s</p>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
                    <h3 style="color: #333; margin-top: 0;">📋 Summary</h3>
                    <p>%s</p>
                </div>
                
                <div style="text-align: center; padding: 25px; background-color: #f8f9fa; border-radius: 8px;">
                    <p style="margin: 0; color: #666; font-size: 14px;">
                        Generated on: %s<br>
                        For support, contact: <a href="mailto:%s" style="color: #667eea;">%s</a>
                    </p>
                </div>
            </body>
            </html>
            """,
            COMPANY_NAME,
            alertCount > 0 ? "#dc3545" : "#28a745",
            alertCount,
            alertCount != 1 ? "s" : "",
            alertCount > 0 ? 
                "You have active inventory alerts that require attention. Please review the items with low stock levels and consider placing purchase orders." :
                "Great news! There are no active inventory alerts at this time. All items are adequately stocked.",
            java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' HH:mm")),
            SUPPORT_EMAIL, SUPPORT_EMAIL
        );
    }
} 