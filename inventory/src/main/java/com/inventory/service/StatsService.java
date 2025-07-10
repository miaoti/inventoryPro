package com.inventory.service;

import com.inventory.dto.*;
import com.inventory.entity.Item;
import com.inventory.repository.ItemRepository;
import com.inventory.repository.UsageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class StatsService {
    
    private static final Logger logger = LoggerFactory.getLogger(StatsService.class);

    @Autowired
    private UsageRepository usageRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private AdminSettingsService adminSettingsService;

    /**
     * Get daily usage statistics for the last N days
     */
    public List<DailyUsageDto> getDailyUsage(int days) {
        try {
            LocalDateTime startDate = LocalDateTime.now().minusDays(days);
            logger.info("Getting daily usage stats from: {}", startDate);
            
            List<Object[]> results = usageRepository.getDailyUsageStats(startDate);
            logger.info("Raw query returned {} results", results != null ? results.size() : 0);
            
            List<DailyUsageDto> dailyUsage = new ArrayList<>();
            
            if (results != null) {
                for (Object[] result : results) {
                    if (result != null && result.length >= 2) {
                        logger.debug("Processing result: {} (type: {}), {} (type: {})", 
                            result[0], result[0] != null ? result[0].getClass().getSimpleName() : "null",
                            result[1], result[1] != null ? result[1].getClass().getSimpleName() : "null");
                        
                        try {
                            // Handle different possible date types from native query
                            LocalDate date = null;
                            if (result[0] instanceof LocalDate) {
                                date = (LocalDate) result[0];
                            } else if (result[0] instanceof java.sql.Date) {
                                date = ((java.sql.Date) result[0]).toLocalDate();
                            } else if (result[0] instanceof java.util.Date) {
                                date = new java.sql.Date(((java.util.Date) result[0]).getTime()).toLocalDate();
                            } else if (result[0] != null) {
                                // Try to parse as string
                                date = LocalDate.parse(result[0].toString());
                            }
                            
                            // Handle different possible number types
                            Long usage = null;
                            if (result[1] instanceof Long) {
                                usage = (Long) result[1];
                            } else if (result[1] instanceof Integer) {
                                usage = ((Integer) result[1]).longValue();
                            } else if (result[1] instanceof java.math.BigDecimal) {
                                usage = ((java.math.BigDecimal) result[1]).longValue();
                            } else if (result[1] instanceof java.math.BigInteger) {
                                usage = ((java.math.BigInteger) result[1]).longValue();
                            } else if (result[1] != null) {
                                usage = Long.valueOf(result[1].toString());
                            }
                            
                            if (date != null && usage != null) {
                                DailyUsageDto dto = new DailyUsageDto(date, usage);
                                dailyUsage.add(dto);
                                logger.debug("Added daily usage: {} -> {}", date, usage);
                            } else {
                                logger.warn("Skipping result with null date or usage: date={}, usage={}", date, usage);
                            }
                        } catch (Exception e) {
                            logger.warn("Error processing daily usage result: {}", e.getMessage());
                        }
                    }
                }
            }
            
            logger.info("Returning {} daily usage records", dailyUsage.size());
            return dailyUsage;
        } catch (Exception e) {
            logger.error("Error getting daily usage statistics", e);
            return new ArrayList<>();
        }
    }

    /**
     * Get daily usage statistics for a specific date range
     */
    public List<DailyUsageDto> getDailyUsageFiltered(LocalDate startDate, LocalDate endDate) {
        try {
            LocalDateTime startDateTime = startDate.atStartOfDay();
            LocalDateTime endDateTime = endDate.atTime(23, 59, 59);
            logger.info("Getting filtered daily usage stats from: {} to {}", startDateTime, endDateTime);
            
            List<Object[]> results = usageRepository.getDailyUsageStatsFiltered(startDateTime, endDateTime);
            logger.info("Filtered query returned {} results", results != null ? results.size() : 0);
            
            List<DailyUsageDto> dailyUsage = new ArrayList<>();
            
            if (results != null) {
                for (Object[] result : results) {
                    if (result != null && result.length >= 2) {
                        try {
                            // Handle different possible date types from native query
                            LocalDate date = null;
                            if (result[0] instanceof LocalDate) {
                                date = (LocalDate) result[0];
                            } else if (result[0] instanceof java.sql.Date) {
                                date = ((java.sql.Date) result[0]).toLocalDate();
                            } else if (result[0] instanceof java.util.Date) {
                                date = new java.sql.Date(((java.util.Date) result[0]).getTime()).toLocalDate();
                            } else if (result[0] != null) {
                                date = LocalDate.parse(result[0].toString());
                            }
                            
                            // Handle different possible number types
                            Long usage = null;
                            if (result[1] instanceof Long) {
                                usage = (Long) result[1];
                            } else if (result[1] instanceof Integer) {
                                usage = ((Integer) result[1]).longValue();
                            } else if (result[1] instanceof java.math.BigDecimal) {
                                usage = ((java.math.BigDecimal) result[1]).longValue();
                            } else if (result[1] instanceof java.math.BigInteger) {
                                usage = ((java.math.BigInteger) result[1]).longValue();
                            } else if (result[1] != null) {
                                usage = Long.valueOf(result[1].toString());
                            }
                            
                            if (date != null && usage != null) {
                                DailyUsageDto dto = new DailyUsageDto(date, usage);
                                dailyUsage.add(dto);
                                logger.debug("Added filtered daily usage: {} -> {}", date, usage);
                            } else {
                                logger.warn("Skipping result with null date or usage: date={}, usage={}", date, usage);
                            }
                        } catch (Exception e) {
                            logger.warn("Error processing filtered daily usage result: {}", e.getMessage());
                        }
                    }
                }
            }
            
            logger.info("Returning {} filtered daily usage records", dailyUsage.size());
            return dailyUsage;
        } catch (Exception e) {
            logger.error("Error getting filtered daily usage statistics", e);
            return new ArrayList<>();
        }
    }

    /**
     * Get top N most used items
     */
    public List<TopUsageItemDto> getTopUsageItems(int limit) {
        try {
            Pageable pageable = PageRequest.of(0, limit);
            List<Object[]> results = usageRepository.getTopUsageItems(pageable);
            
            if (results == null || results.isEmpty()) {
                return new ArrayList<>();
            }
            
            // Calculate total usage for percentage calculation
            long totalUsage = results.stream()
                .filter(result -> result != null && result.length >= 4 && result[3] != null)
                .mapToLong(result -> ((Long) result[3]))
                .sum();
            
            List<TopUsageItemDto> topItems = new ArrayList<>();
            
            for (Object[] result : results) {
                if (result != null && result.length >= 4) {
                    Long id = (Long) result[0];
                    String name = (String) result[1];
                    String code = (String) result[2];
                    Long itemUsage = (Long) result[3];
                    
                    if (id != null && name != null && code != null && itemUsage != null) {
                        TopUsageItemDto dto = new TopUsageItemDto(id, name, code, itemUsage);
                        
                        // Calculate percentage
                        if (totalUsage > 0) {
                            int percentage = (int) Math.round((double) itemUsage / totalUsage * 100);
                            dto.setPercentage(percentage);
                        }
                        
                        topItems.add(dto);
                    }
                }
            }
            
            return topItems;
        } catch (Exception e) {
            logger.error("Error getting top usage items", e);
            return new ArrayList<>();
        }
    }

    /**
     * Get top N most used items with date range filter
     */
    public List<TopUsageItemDto> getTopUsageItemsFiltered(int limit, LocalDate startDate, LocalDate endDate) {
        try {
            LocalDateTime startDateTime = startDate.atStartOfDay();
            LocalDateTime endDateTime = endDate.atTime(23, 59, 59);
            logger.info("Getting filtered top usage items from: {} to {}", startDateTime, endDateTime);
            
            Pageable pageable = PageRequest.of(0, limit);
            List<Object[]> results = usageRepository.getTopUsageItemsFiltered(pageable, startDateTime, endDateTime);
            
            if (results == null || results.isEmpty()) {
                return new ArrayList<>();
            }
            
            // Calculate total usage for percentage calculation
            long totalUsage = results.stream()
                .filter(result -> result != null && result.length >= 4 && result[3] != null)
                .mapToLong(result -> ((Long) result[3]))
                .sum();
            
            List<TopUsageItemDto> topItems = new ArrayList<>();
            
            for (Object[] result : results) {
                if (result != null && result.length >= 4) {
                    Long id = (Long) result[0];
                    String name = (String) result[1];
                    String code = (String) result[2];
                    Long itemUsage = (Long) result[3];
                    
                    if (id != null && name != null && code != null && itemUsage != null) {
                        TopUsageItemDto dto = new TopUsageItemDto(id, name, code, itemUsage);
                        
                        // Calculate percentage
                        if (totalUsage > 0) {
                            int percentage = (int) Math.round((double) itemUsage / totalUsage * 100);
                            dto.setPercentage(percentage);
                        }
                        
                        topItems.add(dto);
                    }
                }
            }
            
            logger.info("Returning {} filtered top usage items", topItems.size());
            return topItems;
        } catch (Exception e) {
            logger.error("Error getting filtered top usage items", e);
            return new ArrayList<>();
        }
    }

    /**
     * Get items that are above safety stock but at or below 110% of safety stock (early warning)
     */
    public List<LowStockItemDto> getLowStockItems() {
        try {
            List<Item> items = itemRepository.findLowStockItems();
            
            if (items == null) {
                return new ArrayList<>();
            }
            
            return items.stream()
                .filter(item -> item != null)
                .map(item -> new LowStockItemDto(
                    item.getId(),
                    item.getName(),
                    item.getCode(),
                    item.getCurrentInventory(),
                    item.getSafetyStockThreshold()
                ))
                .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Error getting low stock items", e);
            return new ArrayList<>();
        }
    }

    /**
     * Get stock alerts (critical and warning level items)
     */
    public List<StockAlertDto> getStockAlerts() {
        try {
            // Get configurable thresholds
            int warningThreshold = adminSettingsService.getWarningThreshold();
            int criticalThreshold = adminSettingsService.getCriticalThreshold();
            
            List<Item> items = itemRepository.findStockAlertItems(warningThreshold);
            
            if (items == null) {
                return new ArrayList<>();
            }
            
            return items.stream()
                .filter(item -> item != null)
                .map(item -> new StockAlertDto(
                    item.getId(),
                    item.getName(),
                    item.getCode(),
                    item.getCurrentInventory(),
                    item.getSafetyStockThreshold(),
                    criticalThreshold,
                    warningThreshold
                ))
                .filter(alert -> alert != null && !"normal".equals(alert.getAlertType())) // Only include alerts
                .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Error getting stock alerts", e);
            return new ArrayList<>();
        }
    }

    /**
     * Get comprehensive quick stats for dashboard
     */
    public QuickStatsDto getQuickStats() {
        return getQuickStatsByDepartment(null); // null = all departments
    }
    
    /**
     * Get comprehensive quick stats for dashboard filtered by department
     */
    public QuickStatsDto getQuickStatsByDepartment(String department) {
        try {
            QuickStatsDto stats = new QuickStatsDto();
            
            // Set the department for context
            stats.setDepartment(department);
            
            // Get daily usage for last 7 days
            stats.setDailyUsage(getDailyUsageByDepartment(7, department));
            
            // Get top 5 usage items
            stats.setTopUsageItems(getTopUsageItemsByDepartment(5, department));
            
            // Get low stock items
            stats.setLowStockItems(getLowStockItemsByDepartment(department));
            
            // Get stock alerts
            stats.setStockAlerts(getStockAlertsByDepartment(department));
            
            // Get general inventory statistics using configurable thresholds
            try {
                int warningThreshold = adminSettingsService.getWarningThreshold();
                int criticalThreshold = adminSettingsService.getCriticalThreshold();
                
                Object[] inventoryStats = getInventoryStatisticsByDepartment(department, warningThreshold, criticalThreshold);
                if (inventoryStats != null && inventoryStats.length >= 5) {
                    if (inventoryStats[0] != null) stats.setTotalItems(((Long) inventoryStats[0]).intValue());
                    if (inventoryStats[1] != null) stats.setTotalQuantity(((Long) inventoryStats[1]).intValue());
                    if (inventoryStats[2] != null) stats.setAverageQuantity(((Double) inventoryStats[2]).doubleValue());
                    if (inventoryStats[3] != null) stats.setItemsBelowSafetyStock(((Long) inventoryStats[3]).intValue());
                    if (inventoryStats[4] != null) stats.setCriticalStockItems(((Long) inventoryStats[4]).intValue());
                }
            } catch (Exception e) {
                logger.warn("Error getting inventory statistics, using defaults", e);
                // Set default values if inventory statistics fail
                stats.setTotalItems(0);
                stats.setTotalQuantity(0);
                stats.setAverageQuantity(0.0);
                stats.setItemsBelowSafetyStock(0);
                stats.setCriticalStockItems(0);
            }
            
            return stats;
        } catch (Exception e) {
            logger.error("Error getting quick stats for department: {}", department, e);
            // Return empty stats rather than throwing exception
            QuickStatsDto emptyStats = new QuickStatsDto();
            emptyStats.setDailyUsage(new ArrayList<>());
            emptyStats.setTopUsageItems(new ArrayList<>());
            emptyStats.setLowStockItems(new ArrayList<>());
            emptyStats.setStockAlerts(new ArrayList<>());
            emptyStats.setTotalItems(0);
            emptyStats.setTotalQuantity(0);
            emptyStats.setAverageQuantity(0.0);
            emptyStats.setItemsBelowSafetyStock(0);
            emptyStats.setCriticalStockItems(0);
            return emptyStats;
        }
    }

    /**
     * Get usage statistics by department
     */
    public List<Object[]> getUsageByDepartment() {
        try {
            return usageRepository.getUsageByDepartment();
        } catch (Exception e) {
            logger.error("Error getting usage by department", e);
            return new ArrayList<>();
        }
    }

    /**
     * Get usage statistics for a specific time period
     */
    public Object[] getUsageStatistics(LocalDateTime startDate, LocalDateTime endDate) {
        try {
            return usageRepository.getUsageStatistics(startDate, endDate);
        } catch (Exception e) {
            logger.error("Error getting usage statistics", e);
            return new Object[0];
        }
    }
    
    // Department-specific methods for Quick Stats
    
    /**
     * Get daily usage filtered by department
     */
    public List<DailyUsageDto> getDailyUsageByDepartment(int days, String department) {
        if (department == null || department.trim().isEmpty()) {
            return getDailyUsage(days); // Return all if no department specified
        }
        
        try {
            LocalDateTime startDate = LocalDateTime.now().minusDays(days).withHour(0).withMinute(0).withSecond(0);
            List<Object[]> results = usageRepository.getDailyUsageByDepartment(startDate, department);
            
            if (results == null) {
                return new ArrayList<>();
            }
            
            return results.stream()
                .filter(result -> result != null && result.length >= 2)
                .map(result -> {
                    LocalDate date = ((java.sql.Date) result[0]).toLocalDate();
                    Long quantity = (Long) result[1];
                    return new DailyUsageDto(date, quantity);
                })
                .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Error getting daily usage by department: {}", department, e);
            return new ArrayList<>();
        }
    }
    
    /**
     * Get top usage items filtered by department
     */
    public List<TopUsageItemDto> getTopUsageItemsByDepartment(int limit, String department) {
        if (department == null || department.trim().isEmpty()) {
            return getTopUsageItems(limit); // Return all if no department specified
        }
        
        try {
            Pageable pageable = PageRequest.of(0, limit);
            List<Object[]> results = usageRepository.getTopUsageItemsByDepartment(pageable, department);
            
            if (results == null || results.isEmpty()) {
                return new ArrayList<>();
            }
            
            // Calculate total usage for percentage calculation
            long totalUsage = results.stream()
                .filter(result -> result != null && result.length >= 4 && result[3] != null)
                .mapToLong(result -> ((Long) result[3]))
                .sum();
            
            List<TopUsageItemDto> topItems = new ArrayList<>();
            
            for (Object[] result : results) {
                if (result != null && result.length >= 4) {
                    Long id = (Long) result[0];
                    String name = (String) result[1];
                    String code = (String) result[2];
                    Long itemUsage = (Long) result[3];
                    
                    if (id != null && name != null && code != null && itemUsage != null) {
                        TopUsageItemDto dto = new TopUsageItemDto(id, name, code, itemUsage);
                        
                        // Calculate percentage
                        if (totalUsage > 0) {
                            int percentage = (int) Math.round((double) itemUsage / totalUsage * 100);
                            dto.setPercentage(percentage);
                        }
                        
                        topItems.add(dto);
                    }
                }
            }
            
            return topItems;
        } catch (Exception e) {
            logger.error("Error getting top usage items by department: {}", department, e);
            return new ArrayList<>();
        }
    }
    
    /**
     * Get low stock items filtered by department
     */
    public List<LowStockItemDto> getLowStockItemsByDepartment(String department) {
        try {
            List<Item> items;
            if (department == null || department.trim().isEmpty()) {
                items = itemRepository.findLowStockItems(); // All departments
            } else {
                items = itemRepository.findLowStockItemsByDepartment(department);
            }
            
            if (items == null) {
                return new ArrayList<>();
            }
            
            return items.stream()
                .filter(item -> item != null)
                .map(item -> new LowStockItemDto(
                    item.getId(),
                    item.getName(),
                    item.getCode(),
                    item.getCurrentInventory(),
                    item.getSafetyStockThreshold()
                ))
                .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Error getting low stock items by department: {}", department, e);
            return new ArrayList<>();
        }
    }
    
    /**
     * Get stock alerts filtered by department
     */
    public List<StockAlertDto> getStockAlertsByDepartment(String department) {
        try {
            // Get configurable thresholds
            int warningThreshold = adminSettingsService.getWarningThreshold();
            int criticalThreshold = adminSettingsService.getCriticalThreshold();
            
            List<Item> items;
            if (department == null || department.trim().isEmpty()) {
                items = itemRepository.findStockAlertItems(warningThreshold); // All departments
            } else {
                items = itemRepository.findCriticalStockItemsByDepartment(department, warningThreshold);
            }
            
            if (items == null) {
                return new ArrayList<>();
            }
            
            return items.stream()
                .filter(item -> item != null)
                .map(item -> new StockAlertDto(
                    item.getId(),
                    item.getName(),
                    item.getCode(),
                    item.getCurrentInventory(),
                    item.getSafetyStockThreshold(),
                    criticalThreshold,
                    warningThreshold
                ))
                .filter(alert -> alert != null && !"normal".equals(alert.getAlertType())) // Only include alerts
                .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Error getting stock alerts by department: {}", department, e);
            return new ArrayList<>();
        }
    }
    
    /**
     * Get inventory statistics filtered by department
     */
    public Object[] getInventoryStatisticsByDepartment(String department, int warningThreshold, int criticalThreshold) {
        try {
            if (department == null || department.trim().isEmpty()) {
                return itemRepository.getInventoryStatistics(warningThreshold, criticalThreshold);
            } else {
                return itemRepository.getInventoryStatisticsByDepartment(department, warningThreshold, criticalThreshold);
            }
        } catch (Exception e) {
            logger.error("Error getting inventory statistics by department: {}", department, e);
            return new Object[]{0L, 0L, 0.0, 0L, 0L}; // Return default empty stats
        }
    }
} 