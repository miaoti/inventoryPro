package com.inventory.controller;

import com.inventory.dto.UserSettingsRequest;
import com.inventory.entity.User;
import com.inventory.service.UserService;
import com.inventory.service.AlertService;
import com.inventory.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/user")
public class UserController {
    
    private static final Logger logger = LoggerFactory.getLogger(UserController.class);
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private AlertService alertService;
    
    @GetMapping("/settings")
    public ResponseEntity<?> getUserSettings(HttpServletRequest request) {
        try {
            String username = getCurrentUsername(request);
            if (username == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Authentication required"));
            }
            
            User user = userService.findByUsername(username);
            if (user == null) {
                return ResponseEntity.status(404).body(Map.of("message", "User not found"));
            }
            
            return ResponseEntity.ok(Map.of(
                "alertEmail", user.getAlertEmail() != null ? user.getAlertEmail() : user.getEmail(),
                "enableEmailAlerts", user.getEnableEmailAlerts(),
                "enableDailyDigest", user.getEnableDailyDigest(),
                "warningThreshold", user.getWarningThreshold(),
                "criticalThreshold", user.getCriticalThreshold()
            ));
            
        } catch (Exception e) {
            logger.error("Failed to get user settings", e);
            return ResponseEntity.status(500).body(Map.of("message", "Failed to load settings"));
        }
    }
    
    @PutMapping("/settings")
    public ResponseEntity<?> updateUserSettings(@Valid @RequestBody UserSettingsRequest settingsRequest, HttpServletRequest request) {
        try {
            String username = getCurrentUsername(request);
            if (username == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Authentication required"));
            }
            
            User user = userService.findByUsername(username);
            if (user == null) {
                return ResponseEntity.status(404).body(Map.of("message", "User not found"));
            }
            
            logger.info("Updating settings for user: {}", username);
            logger.info("Settings request: alertEmail={}, enableEmailAlerts={}, enableDailyDigest={}", 
                settingsRequest.getAlertEmail(), 
                settingsRequest.getEnableEmailAlerts(), 
                settingsRequest.getEnableDailyDigest());
            
            // Update user settings with validation
            if (settingsRequest.getAlertEmail() != null) {
                String alertEmail = settingsRequest.getAlertEmail().trim();
                user.setAlertEmail(alertEmail.isEmpty() ? null : alertEmail);
                logger.info("Alert email set to: {}", user.getAlertEmail());
            }
            
            if (settingsRequest.getEnableEmailAlerts() != null) {
                user.setEnableEmailAlerts(settingsRequest.getEnableEmailAlerts());
                logger.info("Email alerts enabled: {}", user.getEnableEmailAlerts());
            }
            
            if (settingsRequest.getEnableDailyDigest() != null) {
                user.setEnableDailyDigest(settingsRequest.getEnableDailyDigest());
                logger.info("Daily digest enabled: {}", user.getEnableDailyDigest());
            }
            
            // Track if thresholds are being updated for alert re-evaluation
            boolean thresholdChanged = false;
            Integer oldWarningThreshold = user.getWarningThreshold();
            Integer oldCriticalThreshold = user.getCriticalThreshold();
            
            if (settingsRequest.getWarningThreshold() != null) {
                user.setWarningThreshold(settingsRequest.getWarningThreshold());
                if (!settingsRequest.getWarningThreshold().equals(oldWarningThreshold)) {
                    thresholdChanged = true;
                }
                logger.info("Warning threshold set to: {}%", user.getWarningThreshold());
            }
            
            if (settingsRequest.getCriticalThreshold() != null) {
                user.setCriticalThreshold(settingsRequest.getCriticalThreshold());
                if (!settingsRequest.getCriticalThreshold().equals(oldCriticalThreshold)) {
                    thresholdChanged = true;
                }
                logger.info("Critical threshold set to: {}%", user.getCriticalThreshold());
            }
            
            // Save updated user
            userService.save(user);
            
            // Re-evaluate alerts if thresholds changed
            if (thresholdChanged) {
                logger.info("User thresholds changed for {} - Warning: {}% -> {}%, Critical: {}% -> {}%", 
                    user.getUsername(), 
                    oldWarningThreshold, user.getWarningThreshold(),
                    oldCriticalThreshold, user.getCriticalThreshold());
                // We need to inject AlertService here
                try {
                    // This will be handled by importing AlertService
                    alertService.reevaluateAlertsForUserThresholds(user);
                } catch (Exception e) {
                    logger.warn("Failed to re-evaluate alerts after threshold change: {}", e.getMessage());
                    // Don't fail the settings update if alert re-evaluation fails
                }
            }
            
            // Log the effective alert email for debugging
            String effectiveEmail = user.getEffectiveAlertEmail();
            logger.info("User settings updated successfully for user: {}. Effective alert email: {}", username, effectiveEmail);
            
            return ResponseEntity.ok(Map.of(
                "message", "Settings saved successfully",
                "settings", Map.of(
                    "alertEmail", user.getAlertEmail() != null ? user.getAlertEmail() : user.getEmail(),
                    "enableEmailAlerts", user.getEnableEmailAlerts(),
                    "enableDailyDigest", user.getEnableDailyDigest(),
                    "warningThreshold", user.getWarningThreshold(),
                    "criticalThreshold", user.getCriticalThreshold(),
                    "effectiveAlertEmail", effectiveEmail
                )
            ));
            
        } catch (Exception e) {
            logger.error("Failed to update user settings", e);
            return ResponseEntity.status(500).body(Map.of("message", "Failed to save settings"));
        }
    }
    
    private String getCurrentUsername(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                if (!jwtUtil.isTokenExpired(token)) {
                    return jwtUtil.getUsernameFromToken(token);
                }
            } catch (Exception e) {
                logger.warn("Invalid JWT token: {}", e.getMessage());
            }
        }
        return null;
    }
} 