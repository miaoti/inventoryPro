package com.inventory.dto;

import jakarta.validation.constraints.Email;

public class UserSettingsRequest {
    
    @Email(message = "Alert email must be a valid email address")
    private String alertEmail;
    
    private Boolean enableEmailAlerts;
    
    private Boolean enableDailyDigest;
    
    public UserSettingsRequest() {}
    
    public UserSettingsRequest(String alertEmail, Boolean enableEmailAlerts, Boolean enableDailyDigest) {
        this.alertEmail = alertEmail;
        this.enableEmailAlerts = enableEmailAlerts;
        this.enableDailyDigest = enableDailyDigest;
    }
    
    public String getAlertEmail() {
        return alertEmail;
    }
    
    public void setAlertEmail(String alertEmail) {
        this.alertEmail = alertEmail;
    }
    
    public Boolean getEnableEmailAlerts() {
        return enableEmailAlerts;
    }
    
    public void setEnableEmailAlerts(Boolean enableEmailAlerts) {
        this.enableEmailAlerts = enableEmailAlerts;
    }
    
    public Boolean getEnableDailyDigest() {
        return enableDailyDigest;
    }
    
    public void setEnableDailyDigest(Boolean enableDailyDigest) {
        this.enableDailyDigest = enableDailyDigest;
    }
} 