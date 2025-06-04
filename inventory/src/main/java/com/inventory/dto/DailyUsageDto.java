package com.inventory.dto;

import java.time.LocalDate;

public class DailyUsageDto {
    private String date;
    private int usage;
    
    public DailyUsageDto() {}
    
    public DailyUsageDto(String date, int usage) {
        this.date = date;
        this.usage = usage;
    }
    
    public DailyUsageDto(LocalDate date, Long usage) {
        this.date = date.toString();
        this.usage = usage != null ? usage.intValue() : 0;
    }
    
    // Getters and Setters
    public String getDate() {
        return date;
    }
    
    public void setDate(String date) {
        this.date = date;
    }
    
    public int getUsage() {
        return usage;
    }
    
    public void setUsage(int usage) {
        this.usage = usage;
    }
} 