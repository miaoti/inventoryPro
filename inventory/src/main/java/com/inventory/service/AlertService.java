package com.inventory.service;

import com.inventory.entity.Alert;
import com.inventory.entity.Item;
import com.inventory.entity.User;
import com.inventory.repository.AlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class AlertService {

    @Autowired
    private AlertRepository alertRepository;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private UserService userService;
    
    @Value("${app.alerts.notification-email:miaotingshuo@gmail.com}")
    private String fallbackNotificationEmail;

    public void checkAndCreateSafetyStockAlert(Item item) {
        // Calculate effective inventory - currentInventory already reflects usage, so just add pending PO
        int effectiveInventory = item.getCurrentInventory() + item.getPendingPO();
        
        if (effectiveInventory < item.getSafetyStockThreshold()) {
            // Check if there's an existing unresolved alert for this item
            List<Alert> existingAlerts = alertRepository.findByItemAndResolvedFalse(item);
            
            if (existingAlerts.isEmpty()) {
                // Create new alert if none exists
                createNewAlert(item, effectiveInventory);
            } else {
                // Check if we should create a new alert (for status updates)
                Alert latestAlert = existingAlerts.get(0); // Should be ordered by creation date
                
                // Create a new alert if:
                // 1. The inventory has changed significantly (different levels)
                // 2. It's been more than 24 hours since the last alert
                boolean inventoryChanged = hasInventoryChangedSignificantly(latestAlert, effectiveInventory);
                boolean timePassed = hasEnoughTimePassed(latestAlert);
                
                if (inventoryChanged || timePassed) {
                    // Resolve the old alert and create a new one for updated status
                    latestAlert.resolve();
                    alertRepository.save(latestAlert);
                    createNewAlert(item, effectiveInventory);
                }
            }
        } else {
            // Resolve existing alerts if inventory is back above threshold
            List<Alert> existingAlerts = alertRepository.findByItemAndResolvedFalse(item);
            for (Alert alert : existingAlerts) {
                alert.resolve();
                alertRepository.save(alert);
            }
        }
    }

    private void createNewAlert(Item item, int effectiveInventory) {
        Alert alert = new Alert();
        alert.setItem(item);
        
        // Determine alert type based on severity
        String alertType = determineAlertType(effectiveInventory, item.getSafetyStockThreshold());
        alert.setAlertType(alertType);
        
        alert.setMessage(String.format(
            "%s alert: %s (%s) has effective inventory of %d units, below safety threshold of %d units.",
            alertType.replace("_", " ").toLowerCase(), 
            item.getName(), 
            item.getCode(), 
            effectiveInventory, 
            item.getSafetyStockThreshold()
        ));
        
        alert.setCurrentInventory(item.getCurrentInventory());
        alert.setPendingPO(item.getPendingPO());
        alert.setUsedInventory(item.getUsedInventory());
        alert.setSafetyStockThreshold(item.getSafetyStockThreshold());
        
        Alert savedAlert = alertRepository.save(alert);
        
        // Send email notification to all users who want alerts
        sendNotificationToUsers(savedAlert);
    }

    private String determineAlertType(int effectiveInventory, int safetyThreshold) {
        double ratio = (double) effectiveInventory / safetyThreshold;
        
        if (ratio < 0.2) {
            return "CRITICAL_STOCK";
        } else {
            return "WARNING_STOCK";
        }
    }

    private boolean hasInventoryChangedSignificantly(Alert lastAlert, int currentEffectiveInventory) {
        int lastEffectiveInventory = lastAlert.getCurrentInventory() + lastAlert.getPendingPO();
        
        // Consider it significant if inventory changed by more than 10% or crossed severity threshold
        double changePercent = Math.abs((double)(currentEffectiveInventory - lastEffectiveInventory) / lastAlert.getSafetyStockThreshold());
        
        // Also check if severity level changed
        String lastType = determineAlertType(lastEffectiveInventory, lastAlert.getSafetyStockThreshold());
        String currentType = determineAlertType(currentEffectiveInventory, lastAlert.getSafetyStockThreshold());
        
        return changePercent >= 0.1 || !lastType.equals(currentType);
    }

    private boolean hasEnoughTimePassed(Alert lastAlert) {
        // Create new alert if more than 24 hours have passed
        return ChronoUnit.HOURS.between(lastAlert.getCreatedAt(), LocalDateTime.now()) >= 24;
    }

    public List<Alert> getAllAlerts() {
        return alertRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Alert> getActiveAlerts() {
        return alertRepository.findByResolvedFalseOrderByCreatedAtDesc();
    }

    public long getActiveAlertCount() {
        return alertRepository.countByResolvedFalse();
    }

    public long getUnreadAlertCount() {
        return alertRepository.countByResolvedFalseAndReadFalse();
    }

    public List<Alert> getUnreadAlerts() {
        return alertRepository.findUnreadAlertsOrderByCreatedAtDesc();
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
            // Get all users who have email alerts enabled
            List<User> users = userService.findUsersWithEmailAlertsEnabled();
            
            if (users.isEmpty()) {
                // Fallback to global notification email if no users have alerts enabled
                emailService.sendAlertNotification(alert, fallbackNotificationEmail);
                System.out.println("ALERT EMAIL SENT (fallback): " + alert.getMessage());
            } else {
                // Send alert to each user who wants email notifications
                for (User user : users) {
                    String alertEmail = user.getEffectiveAlertEmail();
                    emailService.sendAlertNotification(alert, alertEmail);
                    System.out.println("ALERT EMAIL SENT to " + alertEmail + ": " + alert.getMessage());
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to send alert notification: " + e.getMessage());
            // Continue operation even if email fails
        }
    }
    
    /**
     * Send daily summary of active alerts to all users who want daily digest
     */
    public void sendDailySummary() {
        try {
            long activeAlertCount = getActiveAlertCount();
            
            // Get all users who have daily digest enabled
            List<User> users = userService.findUsersWithDailyDigestEnabled();
            
            if (users.isEmpty()) {
                // Fallback to global notification email if no users have daily digest enabled
                emailService.sendLowStockSummary(fallbackNotificationEmail, activeAlertCount);
                System.out.println("Daily summary email sent (fallback) with " + activeAlertCount + " active alerts");
            } else {
                // Send daily summary to each user who wants it
                for (User user : users) {
                    String alertEmail = user.getEffectiveAlertEmail();
                    emailService.sendLowStockSummary(alertEmail, activeAlertCount);
                    System.out.println("Daily summary email sent to " + alertEmail + " with " + activeAlertCount + " active alerts");
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to send daily summary: " + e.getMessage());
        }
    }
} 