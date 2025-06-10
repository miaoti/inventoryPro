package com.inventory.controller;

import com.inventory.dto.UserSettingsRequest;
import com.inventory.entity.User;
import com.inventory.service.UserService;
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
                "enableDailyDigest", user.getEnableDailyDigest()
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
            
            // Save updated user
            userService.save(user);
            
            // Log the effective alert email for debugging
            String effectiveEmail = user.getEffectiveAlertEmail();
            logger.info("User settings updated successfully for user: {}. Effective alert email: {}", username, effectiveEmail);
            
            return ResponseEntity.ok(Map.of(
                "message", "Settings saved successfully",
                "settings", Map.of(
                    "alertEmail", user.getAlertEmail() != null ? user.getAlertEmail() : user.getEmail(),
                    "enableEmailAlerts", user.getEnableEmailAlerts(),
                    "enableDailyDigest", user.getEnableDailyDigest(),
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