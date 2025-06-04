package com.inventory.dto;

public class TopUsageItemDto {
    private Long id;
    private String name;
    private String code;
    private int totalUsage;
    private int percentage;
    
    public TopUsageItemDto() {}
    
    public TopUsageItemDto(Long id, String name, String code, Long totalUsage) {
        this.id = id;
        this.name = name;
        this.code = code;
        this.totalUsage = totalUsage != null ? totalUsage.intValue() : 0;
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
    
    public int getTotalUsage() {
        return totalUsage;
    }
    
    public void setTotalUsage(int totalUsage) {
        this.totalUsage = totalUsage;
    }
    
    public int getPercentage() {
        return percentage;
    }
    
    public void setPercentage(int percentage) {
        this.percentage = percentage;
    }
} 