package com.inventory.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "system_logs")
public class SystemLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private LocalDateTime timestamp;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LogLevel level;
    
    @Column(nullable = false)
    private String action;
    
    @Column(name = "username")
    private String username;
    
    @Column(nullable = false, length = 1000)
    private String details;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LogModule module;
    
    @Column(name = "ip_address")
    private String ipAddress;
    
    @Column(name = "user_agent")
    private String userAgent;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    // Constructors
    public SystemLog() {}
    
    public SystemLog(LogLevel level, String action, String username, String details, LogModule module, String ipAddress) {
        this.timestamp = LocalDateTime.now();
        this.level = level;
        this.action = action;
        this.username = username;
        this.details = details;
        this.module = module;
        this.ipAddress = ipAddress;
    }
    
    // Enums
    public enum LogLevel {
        INFO, WARN, ERROR, DEBUG
    }
    
    public enum LogModule {
        AUTH, INVENTORY, PURCHASE, SYSTEM, USER
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public LocalDateTime getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
    
    public LogLevel getLevel() {
        return level;
    }
    
    public void setLevel(LogLevel level) {
        this.level = level;
    }
    
    public String getAction() {
        return action;
    }
    
    public void setAction(String action) {
        this.action = action;
    }
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public String getDetails() {
        return details;
    }
    
    public void setDetails(String details) {
        this.details = details;
    }
    
    public LogModule getModule() {
        return module;
    }
    
    public void setModule(LogModule module) {
        this.module = module;
    }
    
    public String getIpAddress() {
        return ipAddress;
    }
    
    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }
    
    public String getUserAgent() {
        return userAgent;
    }
    
    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
} 