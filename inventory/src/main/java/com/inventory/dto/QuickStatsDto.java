package com.inventory.dto;

import java.util.List;

public class QuickStatsDto {
    private List<DailyUsageDto> dailyUsage;
    private List<TopUsageItemDto> topUsageItems;
    private List<LowStockItemDto> lowStockItems;
    private List<StockAlertDto> stockAlerts;
    private int totalItems;
    private int totalQuantity;
    private double averageQuantity;
    private int itemsBelowSafetyStock;
    private int criticalStockItems;
    
    public QuickStatsDto() {}
    
    // Getters and Setters
    public List<DailyUsageDto> getDailyUsage() {
        return dailyUsage;
    }
    
    public void setDailyUsage(List<DailyUsageDto> dailyUsage) {
        this.dailyUsage = dailyUsage;
    }
    
    public List<TopUsageItemDto> getTopUsageItems() {
        return topUsageItems;
    }
    
    public void setTopUsageItems(List<TopUsageItemDto> topUsageItems) {
        this.topUsageItems = topUsageItems;
    }
    
    public List<LowStockItemDto> getLowStockItems() {
        return lowStockItems;
    }
    
    public void setLowStockItems(List<LowStockItemDto> lowStockItems) {
        this.lowStockItems = lowStockItems;
    }
    
    public List<StockAlertDto> getStockAlerts() {
        return stockAlerts;
    }
    
    public void setStockAlerts(List<StockAlertDto> stockAlerts) {
        this.stockAlerts = stockAlerts;
    }
    
    public int getTotalItems() {
        return totalItems;
    }
    
    public void setTotalItems(int totalItems) {
        this.totalItems = totalItems;
    }
    
    public int getTotalQuantity() {
        return totalQuantity;
    }
    
    public void setTotalQuantity(int totalQuantity) {
        this.totalQuantity = totalQuantity;
    }
    
    public double getAverageQuantity() {
        return averageQuantity;
    }
    
    public void setAverageQuantity(double averageQuantity) {
        this.averageQuantity = averageQuantity;
    }
    
    public int getItemsBelowSafetyStock() {
        return itemsBelowSafetyStock;
    }
    
    public void setItemsBelowSafetyStock(int itemsBelowSafetyStock) {
        this.itemsBelowSafetyStock = itemsBelowSafetyStock;
    }
    
    public int getCriticalStockItems() {
        return criticalStockItems;
    }
    
    public void setCriticalStockItems(int criticalStockItems) {
        this.criticalStockItems = criticalStockItems;
    }
} 