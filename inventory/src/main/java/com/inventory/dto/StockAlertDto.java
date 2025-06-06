package com.inventory.dto;

public class StockAlertDto {
    private Long id;
    private String name;
    private String code;
    private int currentInventory;
    private int safetyStock;
    private String alertType; // "critical" or "warning"
    private int percentage;
    
    public StockAlertDto() {}
    
    public StockAlertDto(Long id, String name, String code, Integer currentInventory, Integer safetyStock) {
        this.id = id;
        this.name = name;
        this.code = code;
        this.currentInventory = currentInventory != null ? currentInventory : 0;
        this.safetyStock = safetyStock != null ? safetyStock : 0;
        
        // Calculate percentage and determine alert type using hardcoded defaults
        // This constructor is for backward compatibility
        this.percentage = this.safetyStock > 0 ? (int) Math.round((double) this.currentInventory / this.safetyStock * 100) : 0;
        this.alertType = determineAlertType(50, 100); // Default: 50% critical, 100% warning
    }
    
    public StockAlertDto(Long id, String name, String code, Integer currentInventory, Integer safetyStock, 
                        int criticalThresholdPercent, int warningThresholdPercent) {
        this.id = id;
        this.name = name;
        this.code = code;
        this.currentInventory = currentInventory != null ? currentInventory : 0;
        this.safetyStock = safetyStock != null ? safetyStock : 0;
        
        // Calculate percentage and determine alert type using configurable thresholds
        this.percentage = this.safetyStock > 0 ? (int) Math.round((double) this.currentInventory / this.safetyStock * 100) : 0;
        this.alertType = determineAlertType(criticalThresholdPercent, warningThresholdPercent);
    }
    
    private String determineAlertType(int criticalThresholdPercent, int warningThresholdPercent) {
        if (this.safetyStock > 0) {
            if (this.percentage <= criticalThresholdPercent) {
                return "critical";
            } else if (this.percentage <= warningThresholdPercent) {
                return "warning";
            } else {
                return "normal"; // Should not be included in alerts, but just in case
            }
        } else {
            return "critical";
        }
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getCode() {
        return code;
    }
    
    public void setCode(String code) {
        this.code = code;
    }
    
    public int getCurrentInventory() {
        return currentInventory;
    }
    
    public void setCurrentInventory(int currentInventory) {
        this.currentInventory = currentInventory;
    }
    
    public int getSafetyStock() {
        return safetyStock;
    }
    
    public void setSafetyStock(int safetyStock) {
        this.safetyStock = safetyStock;
    }
    
    public String getAlertType() {
        return alertType;
    }
    
    public void setAlertType(String alertType) {
        this.alertType = alertType;
    }
    
    public int getPercentage() {
        return percentage;
    }
    
    public void setPercentage(int percentage) {
        this.percentage = percentage;
    }
} 