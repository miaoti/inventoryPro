package com.inventory.service;

import com.inventory.entity.Alert;
import com.inventory.entity.Item;
import com.inventory.entity.User;
import com.inventory.repository.AlertRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.HashSet;

@Service
public class AlertService {

    private static final Logger logger = LoggerFactory.getLogger(AlertService.class);

    @Autowired
    private AlertRepository alertRepository;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private AdminSettingsService adminSettingsService;
    
    @Value("${app.alerts.notification-email:miaotingshuo@gmail.com}")
    private String fallbackNotificationEmail;

    public void checkAndCreateSafetyStockAlert(Item item) {
        // Use current inventory only (not effective inventory)
        int currentInventory = item.getCurrentInventory();
        int safetyThreshold = item.getSafetyStockThreshold();
        
        System.out.println("=== ALERT CHECK DEBUG ===");
        System.out.println("Item: " + item.getName() + " (" + item.getCode() + ")");
        System.out.println("Current Inventory: " + currentInventory);
        System.out.println("Safety Threshold: " + safetyThreshold);
        
        // Get configurable thresholds from admin settings
        double warningThresholdPercent = adminSettingsService.getWarningThreshold() / 100.0;
        double criticalThresholdPercent = adminSettingsService.getCriticalThreshold() / 100.0;
        
        System.out.println("Warning Threshold %: " + (warningThresholdPercent * 100));
        System.out.println("Critical Threshold %: " + (criticalThresholdPercent * 100));
        
        // Calculate threshold values
        int warningThreshold = (int) Math.round(safetyThreshold * warningThresholdPercent);
        int criticalThreshold = (int) Math.round(safetyThreshold * criticalThresholdPercent);
        
        System.out.println("Warning Threshold Value: " + warningThreshold);
        System.out.println("Critical Threshold Value: " + criticalThreshold);
        System.out.println("Should trigger alert? " + (currentInventory <= warningThreshold && safetyThreshold > 0));
        
        // Check if alert should be triggered (current inventory below warning threshold)
        if (currentInventory <= warningThreshold && safetyThreshold > 0) {
            System.out.println("ALERT TRIGGER CONDITIONS MET - Creating alert...");
            
            // Check if there's an existing unresolved alert for this item
            List<Alert> existingAlerts = alertRepository.findByItemAndResolvedFalse(item);
            System.out.println("Existing unresolved alerts: " + existingAlerts.size());
            
            if (existingAlerts.isEmpty()) {
                // Create new alert if none exists
                System.out.println("Creating new alert (no existing alerts)...");
                createNewAlert(item, currentInventory, safetyThreshold, warningThreshold, criticalThreshold);
            } else {
                // Always create new alert and mark existing ones as ignored
                // This ensures we capture every inventory change while below safety threshold
                System.out.println("Marking " + existingAlerts.size() + " existing alerts as ignored and creating new alert...");
                for (Alert alert : existingAlerts) {
                    alert.ignore();
                    alertRepository.save(alert);
                }
                createNewAlert(item, currentInventory, safetyThreshold, warningThreshold, criticalThreshold);
            }
        } else {
            System.out.println("Alert conditions NOT met - checking for alerts to resolve...");
            // Resolve existing alerts if inventory is back above threshold
            List<Alert> existingAlerts = alertRepository.findByItemAndResolvedFalse(item);
            System.out.println("Resolving " + existingAlerts.size() + " existing alerts");
            for (Alert alert : existingAlerts) {
                alert.resolve();
                alertRepository.save(alert);
            }
        }
        System.out.println("========================");
    }

    private void createNewAlert(Item item, int currentInventory, int safetyThreshold, int warningThreshold, int criticalThreshold) {
        Alert alert = new Alert();
        alert.setItem(item);
        
        // Determine alert type based on severity using configurable thresholds
        String alertType = determineAlertType(currentInventory, warningThreshold, criticalThreshold);
        alert.setAlertType(alertType);
        
        // Create more accurate message
        double currentPercent = safetyThreshold > 0 ? (double) currentInventory / safetyThreshold * 100 : 0;
        alert.setMessage(String.format(
            "%s alert: %s (%s) has current inventory of %d units (%.1f%% of safety stock), below warning threshold of %d units.",
            alertType.replace("_", " ").toLowerCase(), 
            item.getName(), 
            item.getCode(), 
            currentInventory,
            currentPercent,
            warningThreshold
        ));
        
        alert.setCurrentInventory(item.getCurrentInventory());
        alert.setPendingPO(item.getPendingPO());
        alert.setUsedInventory(item.getUsedInventory());
        alert.setSafetyStockThreshold(item.getSafetyStockThreshold());
        
        Alert savedAlert = alertRepository.save(alert);
        
        // Send email notification to all users who want alerts
        sendNotificationToUsers(savedAlert);
    }

    private String determineAlertType(int currentInventory, int warningThreshold, int criticalThreshold) {
        if (currentInventory <= criticalThreshold) {
            return "CRITICAL_STOCK";
        } else if (currentInventory <= warningThreshold) {
            return "WARNING_STOCK";
        } else {
            return "NORMAL_STOCK";
        }
    }

    private boolean hasInventoryChangedSignificantly(Alert lastAlert, int currentInventory, int safetyThreshold, int warningThreshold, int criticalThreshold) {
        int lastCurrentInventory = lastAlert.getCurrentInventory();
        
        System.out.println("=== INVENTORY CHANGE CHECK ===");
        System.out.println("Last Alert Inventory: " + lastCurrentInventory);
        System.out.println("Current Inventory: " + currentInventory);
        System.out.println("Safety Threshold: " + safetyThreshold);
        
        // Consider it significant if inventory changed by any amount when below safety threshold
        // This ensures alerts are always updated when inventory changes in critical situations
        boolean inventoryChanged = lastCurrentInventory != currentInventory;
        
        // Calculate change percentage for reference
        double changePercent = safetyThreshold > 0 ? Math.abs((double)(currentInventory - lastCurrentInventory) / safetyThreshold) : 0;
        
        // Check if severity level changed
        String lastType = determineAlertType(lastCurrentInventory, warningThreshold, criticalThreshold);
        String currentType = determineAlertType(currentInventory, warningThreshold, criticalThreshold);
        boolean severityChanged = !lastType.equals(currentType);
        
        System.out.println("Inventory Changed: " + inventoryChanged);
        System.out.println("Change Percent: " + (changePercent * 100) + "%");
        System.out.println("Last Alert Type: " + lastType);
        System.out.println("Current Alert Type: " + currentType);
        System.out.println("Severity Changed: " + severityChanged);
        
        // More aggressive change detection:
        // 1. Any inventory change when below safety threshold
        // 2. Severity level change
        // 3. Significant percentage change (>10%)
        boolean isSignificant = inventoryChanged || severityChanged || changePercent >= 0.1;
        
        System.out.println("Is Change Significant: " + isSignificant);
        System.out.println("==============================");
        
        return isSignificant;
    }

    private boolean hasEnoughTimePassed(Alert lastAlert) {
        // Create new alert if more than 24 hours have passed
        return ChronoUnit.HOURS.between(lastAlert.getCreatedAt(), LocalDateTime.now()) >= 24;
    }

    public List<Alert> getAllAlerts() {
        return alertRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Alert> getActiveAlerts() {
        return alertRepository.findActiveAlertsOrderByCreatedAtDesc();
    }

    public List<Alert> getIgnoredAlerts() {
        return alertRepository.findIgnoredAlertsOrderByIgnoredAtDesc();
    }

    public List<Alert> getResolvedAlerts() {
        return alertRepository.findResolvedAlertsOrderByResolvedAtDesc();
    }

    public long getActiveAlertCount() {
        return alertRepository.countByResolvedFalseAndIgnoredFalse();
    }

    public long getUnreadAlertCount() {
        return alertRepository.countByResolvedFalseAndReadFalseAndIgnoredFalse();
    }

    public List<Alert> getUnreadAlerts() {
        return alertRepository.findActiveUnreadAlertsOrderByCreatedAtDesc();
    }

    public void markAlertAsRead(Long alertId) {
        Optional<Alert> alertOpt = alertRepository.findById(alertId);
        if (alertOpt.isPresent()) {
            Alert alert = alertOpt.get();
            if (!alert.getRead()) {
                alert.markAsRead();
                alertRepository.save(alert);
            }
        }
    }

    public void resolveAlert(Long alertId) {
        Optional<Alert> alertOpt = alertRepository.findById(alertId);
        if (alertOpt.isPresent()) {
            Alert alert = alertOpt.get();
            alert.resolve();
            alertRepository.save(alert);
        }
    }

    private void sendNotificationToUsers(Alert alert) {
        try {
            logger.info("=== EMAIL NOTIFICATION DEBUG START ===");
            logger.info("Alert ID: {}", alert.getId());
            logger.info("Alert Type: {}", alert.getAlertType());
            logger.info("Item: {} ({})", alert.getItem().getName(), alert.getItem().getCode());
            logger.info("Current Inventory: {}", alert.getCurrentInventory());
            logger.info("Safety Threshold: {}", alert.getSafetyStockThreshold());
            
            // Get all users who have email alerts enabled
            List<User> usersWithAlerts = userService.findUsersWithEmailAlertsEnabled();
            logger.info("Found {} users with email alerts enabled", usersWithAlerts.size());
            
            // Always include OWNER users in notifications (even if they don't have alerts enabled)
            List<User> ownerUsers = userService.findByRole(User.UserRole.OWNER);
            logger.info("Found {} OWNER users", ownerUsers.size());
            
            // Combine users with alerts and owner users (remove duplicates)
            Set<User> allNotificationUsers = new HashSet<>(usersWithAlerts);
            for (User owner : ownerUsers) {
                logger.info("Adding OWNER user to notifications: {} ({})", owner.getUsername(), owner.getEffectiveAlertEmail());
                allNotificationUsers.add(owner);
            }
            
            logger.info("Total users to receive notifications: {}", allNotificationUsers.size());
            
            if (allNotificationUsers.isEmpty()) {
                // Fallback to global notification email if no users found
                logger.info("No users found, using fallback email: {}", fallbackNotificationEmail);
                emailService.sendAlertNotification(alert, fallbackNotificationEmail);
                logger.info("✅ ALERT EMAIL SENT (fallback): {}", alert.getMessage());
            } else {
                // Send alert to each user
                for (User user : allNotificationUsers) {
                    String alertEmail = user.getEffectiveAlertEmail();
                    logger.info("Sending alert to user: {} ({}) [{}], email: {}", 
                        user.getUsername(), user.getFullName(), user.getRole(), alertEmail);
                    emailService.sendAlertNotification(alert, alertEmail);
                    logger.info("✅ ALERT EMAIL SENT to {} ({}) [{}]: {}", 
                        alertEmail, user.getUsername(), user.getRole(), alert.getMessage());
                }
            }
            logger.info("=== EMAIL NOTIFICATION DEBUG END ===");
        } catch (Exception e) {
            logger.error("❌ Failed to send alert notification: {} - {}", e.getMessage(), e.toString(), e);
            // Continue operation even if email fails
        }
    }
    
    /**
     * Send daily summary of active alerts to all users who want daily digest
     */
    public void sendDailySummary() {
        try {
            logger.info("=== DAILY SUMMARY DEBUG START ===");
            long activeAlertCount = getActiveAlertCount();
            logger.info("Active alert count: {}", activeAlertCount);
            
            // Get all users who have daily digest enabled
            List<User> usersWithDigest = userService.findUsersWithDailyDigestEnabled();
            logger.info("Found {} users with daily digest enabled", usersWithDigest.size());
            
            // Always include OWNER users in daily summaries (even if they don't have digest enabled)
            List<User> ownerUsers = userService.findByRole(User.UserRole.OWNER);
            logger.info("Found {} OWNER users", ownerUsers.size());
            
            // Combine users with digest and owner users (remove duplicates)
            Set<User> allDigestUsers = new HashSet<>(usersWithDigest);
            for (User owner : ownerUsers) {
                logger.info("Adding OWNER user to daily digest: {} ({})", owner.getUsername(), owner.getEffectiveAlertEmail());
                allDigestUsers.add(owner);
            }
            
            logger.info("Total users to receive daily summary: {}", allDigestUsers.size());
            
            if (allDigestUsers.isEmpty()) {
                // Fallback to global notification email if no users found
                logger.info("No users found, using fallback email: {}", fallbackNotificationEmail);
                emailService.sendLowStockSummary(fallbackNotificationEmail, activeAlertCount);
                logger.info("✅ Daily summary email sent (fallback) with {} active alerts", activeAlertCount);
            } else {
                // Send daily summary to each user
                for (User user : allDigestUsers) {
                    String alertEmail = user.getEffectiveAlertEmail();
                    logger.info("Sending daily summary to user: {} ({}) [{}], email: {}", 
                        user.getUsername(), user.getFullName(), user.getRole(), alertEmail);
                    emailService.sendLowStockSummary(alertEmail, activeAlertCount);
                    logger.info("✅ Daily summary email sent to {} ({}) [{}] with {} active alerts", 
                        alertEmail, user.getUsername(), user.getRole(), activeAlertCount);
                }
            }
            logger.info("=== DAILY SUMMARY DEBUG END ===");
        } catch (Exception e) {
            logger.error("❌ Failed to send daily summary: {} - {}", e.getMessage(), e.toString(), e);
        }
    }
} 