package com.inventory.dto;

public class LowStockItemDto {
    private Long id;
    private String name;
    private String code;
    private int currentInventory;
    private int safetyStock;
    private int percentage;
    
    public LowStockItemDto() {}
    
    public LowStockItemDto(Long id, String name, String code, Integer currentInventory, Integer safetyStock) {
        this.id = id;
        this.name = name;
        this.code = code;
        this.currentInventory = currentInventory != null ? currentInventory : 0;
        this.safetyStock = safetyStock != null ? safetyStock : 0;
        
        // Calculate percentage (current inventory as percentage of safety stock)
        if (this.safetyStock > 0) {
            this.percentage = (int) Math.round((double) this.currentInventory / this.safetyStock * 100);
        } else {
            this.percentage = 0;
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
    
    public int getPercentage() {
        return percentage;
    }
    
    public void setPercentage(int percentage) {
        this.percentage = percentage;
    }
} 