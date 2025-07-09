package com.inventory.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

public class UserSettingsRequest {
    
    @Email(message = "Alert email must be a valid email address")
    private String alertEmail;
    
    private Boolean enableEmailAlerts;
    
    private Boolean enableDailyDigest;
    
    @Min(value = 0, message = "Warning threshold must be between 0 and 200")
    @Max(value = 200, message = "Warning threshold must be between 0 and 200")
    private Integer warningThreshold;
    
    @Min(value = 0, message = "Critical threshold must be between 0 and 200")
    @Max(value = 200, message = "Critical threshold must be between 0 and 200")
    private Integer criticalThreshold;
    
    public UserSettingsRequest() {}
    
    public UserSettingsRequest(String alertEmail, Boolean enableEmailAlerts, Boolean enableDailyDigest) {
        this.alertEmail = alertEmail;
        this.enableEmailAlerts = enableEmailAlerts;
        this.enableDailyDigest = enableDailyDigest;
    }
    
    public UserSettingsRequest(String alertEmail, Boolean enableEmailAlerts, Boolean enableDailyDigest, 
                              Integer warningThreshold, Integer criticalThreshold) {
        this.alertEmail = alertEmail;
        this.enableEmailAlerts = enableEmailAlerts;
        this.enableDailyDigest = enableDailyDigest;
        this.warningThreshold = warningThreshold;
        this.criticalThreshold = criticalThreshold;
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
    
    public Integer getWarningThreshold() {
        return warningThreshold;
    }
    
    public void setWarningThreshold(Integer warningThreshold) {
        this.warningThreshold = warningThreshold;
    }
    
    public Integer getCriticalThreshold() {
        return criticalThreshold;
    }
    
    public void setCriticalThreshold(Integer criticalThreshold) {
        this.criticalThreshold = criticalThreshold;
    }
} 