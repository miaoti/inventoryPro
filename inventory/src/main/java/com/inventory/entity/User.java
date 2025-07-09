package com.inventory.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Column(name = "enabled")
    private Boolean enabled = true;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "alert_email")
    private String alertEmail;
    
    @Column(name = "enable_email_alerts")
    private Boolean enableEmailAlerts = true;
    
    @Column(name = "enable_daily_digest")
    private Boolean enableDailyDigest = false;

    @Column(name = "department")
    private String department = "General";

    // User-specific alert thresholds (as percentages of safety stock)
    @Column(name = "warning_threshold")
    private Integer warningThreshold = 100; // Default: 100% of safety stock

    @Column(name = "critical_threshold")
    private Integer criticalThreshold = 50; // Default: 50% of safety stock

    public enum UserRole {
        OWNER,
        ADMIN,
        USER
    }

    public String getAlertEmail() {
        return alertEmail;
    }

    public void setAlertEmail(String alertEmail) {
        this.alertEmail = alertEmail;
    }

    public Boolean getEnableEmailAlerts() {
        return enableEmailAlerts != null ? enableEmailAlerts : true;
    }

    public void setEnableEmailAlerts(Boolean enableEmailAlerts) {
        this.enableEmailAlerts = enableEmailAlerts;
    }

    public Boolean getEnableDailyDigest() {
        return enableDailyDigest != null ? enableDailyDigest : false;
    }

    public void setEnableDailyDigest(Boolean enableDailyDigest) {
        this.enableDailyDigest = enableDailyDigest;
    }

    /**
     * Get the effective alert email - uses alertEmail if set, otherwise falls back to user's email
     */
    public String getEffectiveAlertEmail() {
        return (alertEmail != null && !alertEmail.trim().isEmpty()) ? alertEmail : email;
    }

    // Threshold getters and setters with default values
    public Integer getWarningThreshold() {
        return warningThreshold != null ? warningThreshold : 100;
    }

    public void setWarningThreshold(Integer warningThreshold) {
        this.warningThreshold = warningThreshold;
    }

    public Integer getCriticalThreshold() {
        return criticalThreshold != null ? criticalThreshold : 50;
    }

    public void setCriticalThreshold(Integer criticalThreshold) {
        this.criticalThreshold = criticalThreshold;
    }

    // Convenience methods for fullName as name (for backward compatibility)
    public String getName() {
        return fullName;
    }

    public void setName(String name) {
        this.fullName = name;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
} 