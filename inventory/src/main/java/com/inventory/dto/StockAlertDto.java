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
        
        // Calculate percentage and determine alert type
        if (this.safetyStock > 0) {
            this.percentage = (int) Math.round((double) this.currentInventory / this.safetyStock * 100);
            
            // Critical: 50% or less of safety stock
            // Warning: below safety stock but above 50%
            if (this.percentage <= 50) {
                this.alertType = "critical";
            } else if (this.percentage < 100) {
                this.alertType = "warning";
            } else {
                this.alertType = "normal"; // Should not be included in alerts, but just in case
            }
        } else {
            this.percentage = 0;
            this.alertType = "critical";
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