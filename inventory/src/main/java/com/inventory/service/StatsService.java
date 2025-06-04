package com.inventory.service;

import com.inventory.dto.*;
import com.inventory.entity.Item;
import com.inventory.repository.ItemRepository;
import com.inventory.repository.UsageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class StatsService {

    @Autowired
    private UsageRepository usageRepository;

    @Autowired
    private ItemRepository itemRepository;

    /**
     * Get daily usage statistics for the last N days
     */
    public List<DailyUsageDto> getDailyUsage(int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        List<Object[]> results = usageRepository.getDailyUsageStats(startDate);
        
        List<DailyUsageDto> dailyUsage = new ArrayList<>();
        
        for (Object[] result : results) {
            LocalDate date = (LocalDate) result[0];
            Long usage = (Long) result[1];
            dailyUsage.add(new DailyUsageDto(date, usage));
        }
        
        return dailyUsage;
    }

    /**
     * Get top N most used items
     */
    public List<TopUsageItemDto> getTopUsageItems(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        List<Object[]> results = usageRepository.getTopUsageItems(pageable);
        
        // Calculate total usage for percentage calculation
        long totalUsage = results.stream()
            .mapToLong(result -> ((Long) result[3]))
            .sum();
        
        List<TopUsageItemDto> topItems = new ArrayList<>();
        
        for (Object[] result : results) {
            Long id = (Long) result[0];
            String name = (String) result[1];
            String code = (String) result[2];
            Long itemUsage = (Long) result[3];
            
            TopUsageItemDto dto = new TopUsageItemDto(id, name, code, itemUsage);
            
            // Calculate percentage
            if (totalUsage > 0) {
                int percentage = (int) Math.round((double) itemUsage / totalUsage * 100);
                dto.setPercentage(percentage);
            }
            
            topItems.add(dto);
        }
        
        return topItems;
    }

    /**
     * Get items that are above safety stock but at or below 110% of safety stock (early warning)
     */
    public List<LowStockItemDto> getLowStockItems() {
        List<Item> items = itemRepository.findLowStockItems();
        
        return items.stream()
            .map(item -> new LowStockItemDto(
                item.getId(),
                item.getName(),
                item.getCode(),
                item.getCurrentInventory(),
                item.getSafetyStockThreshold()
            ))
            .collect(Collectors.toList());
    }

    /**
     * Get stock alerts (critical and warning level items)
     */
    public List<StockAlertDto> getStockAlerts() {
        List<Item> items = itemRepository.findStockAlertItems();
        
        return items.stream()
            .map(item -> new StockAlertDto(
                item.getId(),
                item.getName(),
                item.getCode(),
                item.getCurrentInventory(),
                item.getSafetyStockThreshold()
            ))
            .filter(alert -> !"normal".equals(alert.getAlertType())) // Only include alerts
            .collect(Collectors.toList());
    }

    /**
     * Get comprehensive quick stats for dashboard
     */
    public QuickStatsDto getQuickStats() {
        QuickStatsDto stats = new QuickStatsDto();
        
        // Get daily usage for last 7 days
        stats.setDailyUsage(getDailyUsage(7));
        
        // Get top 5 usage items
        stats.setTopUsageItems(getTopUsageItems(5));
        
        // Get low stock items
        stats.setLowStockItems(getLowStockItems());
        
        // Get stock alerts
        stats.setStockAlerts(getStockAlerts());
        
        // Get general inventory statistics
        Object[] inventoryStats = itemRepository.getInventoryStatistics();
        if (inventoryStats != null) {
            stats.setTotalItems(((Long) inventoryStats[0]).intValue());
            stats.setTotalQuantity(((Long) inventoryStats[1]).intValue());
            stats.setAverageQuantity(((Double) inventoryStats[2]).doubleValue());
            stats.setItemsBelowSafetyStock(((Long) inventoryStats[3]).intValue());
            stats.setCriticalStockItems(((Long) inventoryStats[4]).intValue());
        }
        
        return stats;
    }

    /**
     * Get usage statistics by department
     */
    public List<Object[]> getUsageByDepartment() {
        return usageRepository.getUsageByDepartment();
    }

    /**
     * Get usage statistics for a specific time period
     */
    public Object[] getUsageStatistics(LocalDateTime startDate, LocalDateTime endDate) {
        return usageRepository.getUsageStatistics(startDate, endDate);
    }
} 