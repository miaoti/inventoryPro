package com.inventory.controller;

import com.inventory.entity.User;
import com.inventory.service.UserService;
import com.inventory.service.EmailService;
import com.inventory.entity.Alert;
import com.inventory.entity.Item;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/debug")
public class DebugController {
    
    private static final Logger logger = LoggerFactory.getLogger(DebugController.class);
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private EmailService emailService;
    
    @Value("${spring.mail.username:}")
    private String mailUsername;
    
    @Value("${spring.mail.password:}")
    private String mailPassword;
    
    @Value("${app.alerts.notification-email:}")
    private String fallbackEmail;
    
    @GetMapping("/email-config")
    public ResponseEntity<?> getEmailConfig() {
        Map<String, Object> config = new HashMap<>();
        
        // Mail configuration
        config.put("mailUsername", mailUsername != null && !mailUsername.isEmpty() ? mailUsername : "NOT SET");
        config.put("mailPasswordConfigured", mailPassword != null && !mailPassword.isEmpty());
        config.put("fallbackEmail", fallbackEmail != null && !fallbackEmail.isEmpty() ? fallbackEmail : "NOT SET");
        
        // Users with email alerts
        List<User> usersWithAlerts = userService.findUsersWithEmailAlertsEnabled();
        config.put("usersWithEmailAlertsCount", usersWithAlerts.size());
        
        // OWNER users (always get notifications)
        List<User> ownerUsers = userService.findByRole(User.UserRole.OWNER);
        config.put("ownerUsersCount", ownerUsers.size());
        
        Map<String, Object> userDetails = new HashMap<>();
        // Add users with alerts
        for (User user : usersWithAlerts) {
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("username", user.getUsername());
            userInfo.put("email", user.getEmail());
            userInfo.put("alertEmail", user.getAlertEmail());
            userInfo.put("effectiveAlertEmail", user.getEffectiveAlertEmail());
            userInfo.put("enableEmailAlerts", user.getEnableEmailAlerts());
            userInfo.put("enableDailyDigest", user.getEnableDailyDigest());
            userInfo.put("role", user.getRole().toString());
            userDetails.put(user.getUsername(), userInfo);
        }
        
        // Add OWNER users (they get notifications regardless of email alert setting)
        for (User owner : ownerUsers) {
            if (!userDetails.containsKey(owner.getUsername())) {
                Map<String, Object> userInfo = new HashMap<>();
                userInfo.put("username", owner.getUsername());
                userInfo.put("email", owner.getEmail());
                userInfo.put("alertEmail", owner.getAlertEmail());
                userInfo.put("effectiveAlertEmail", owner.getEffectiveAlertEmail());
                userInfo.put("enableEmailAlerts", owner.getEnableEmailAlerts());
                userInfo.put("enableDailyDigest", owner.getEnableDailyDigest());
                userInfo.put("role", owner.getRole().toString());
                userInfo.put("forcedNotification", true); // OWNER users always get notifications
                userDetails.put(owner.getUsername(), userInfo);
            }
        }
        
        config.put("allNotificationUsers", userDetails);
        
        logger.info("Email configuration debug request - Users with alerts: {}, OWNER users: {}", 
            usersWithAlerts.size(), ownerUsers.size());
        
        return ResponseEntity.ok(config);
    }
    
    @PostMapping("/test-email/{username}")
    public ResponseEntity<?> testEmail(@PathVariable String username) {
        try {
            User user = userService.findByUsername(username);
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }
            
            if (!user.getEnableEmailAlerts()) {
                return ResponseEntity.badRequest().body(Map.of("error", "User does not have email alerts enabled"));
            }
            
            // Create a dummy alert for testing
            Alert testAlert = new Alert();
            Item testItem = new Item();
            testItem.setName("Test Item");
            testItem.setCode("TEST-001");
            testAlert.setItem(testItem);
            testAlert.setAlertType("WARNING_STOCK");
            testAlert.setMessage("This is a test email alert");
            testAlert.setCurrentInventory(5);
            testAlert.setSafetyStockThreshold(10);
            
            String alertEmail = user.getEffectiveAlertEmail();
            logger.info("Testing email send to: {} ({})", alertEmail, user.getUsername());
            
            emailService.sendAlertNotification(testAlert, alertEmail);
            
            return ResponseEntity.ok(Map.of(
                "message", "Test email sent successfully",
                "sentTo", alertEmail,
                "username", user.getUsername()
            ));
            
        } catch (Exception e) {
            logger.error("Failed to send test email", e);
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to send test email: " + e.getMessage()));
        }
    }
} 