package com.inventory.controller;

import com.inventory.dto.*;
import com.inventory.service.StatsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/stats")
public class StatsController {
    
    private static final Logger logger = LoggerFactory.getLogger(StatsController.class);

    @Autowired
    private StatsService statsService;

    @GetMapping("/daily-usage")
    public ResponseEntity<List<DailyUsageDto>> getDailyUsage(
            @RequestParam(defaultValue = "7") int days) {
        try {
            logger.info("Getting daily usage for {} days", days);
            List<DailyUsageDto> dailyUsage = statsService.getDailyUsage(days);
            logger.info("Successfully retrieved {} daily usage records", dailyUsage.size());
            return ResponseEntity.ok(dailyUsage);
        } catch (Exception e) {
            logger.error("Error getting daily usage", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/daily-usage/filtered")
    public ResponseEntity<List<DailyUsageDto>> getDailyUsageFiltered(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        try {
            logger.info("Getting daily usage filtered from {} to {}", startDate, endDate);
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);
            List<DailyUsageDto> dailyUsage = statsService.getDailyUsageFiltered(start, end);
            logger.info("Successfully retrieved {} filtered daily usage records", dailyUsage.size());
            return ResponseEntity.ok(dailyUsage);
        } catch (Exception e) {
            logger.error("Error getting filtered daily usage", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/top-usage")
    public ResponseEntity<List<TopUsageItemDto>> getTopUsageItems(
            @RequestParam(defaultValue = "5") int limit) {
        try {
            logger.info("Getting top {} usage items", limit);
            List<TopUsageItemDto> topItems = statsService.getTopUsageItems(limit);
            logger.info("Successfully retrieved {} top usage items", topItems.size());
            return ResponseEntity.ok(topItems);
        } catch (Exception e) {
            logger.error("Error getting top usage items", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/top-usage/filtered")
    public ResponseEntity<List<TopUsageItemDto>> getTopUsageItemsFiltered(
            @RequestParam(defaultValue = "5") int limit,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        try {
            logger.info("Getting top {} usage items filtered from {} to {}", limit, startDate, endDate);
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);
            List<TopUsageItemDto> topItems = statsService.getTopUsageItemsFiltered(limit, start, end);
            logger.info("Successfully retrieved {} filtered top usage items", topItems.size());
            return ResponseEntity.ok(topItems);
        } catch (Exception e) {
            logger.error("Error getting filtered top usage items", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<LowStockItemDto>> getLowStockItems() {
        try {
            logger.info("Getting low stock items");
            List<LowStockItemDto> lowStockItems = statsService.getLowStockItems();
            logger.info("Successfully retrieved {} low stock items", lowStockItems.size());
            return ResponseEntity.ok(lowStockItems);
        } catch (Exception e) {
            logger.error("Error getting low stock items", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/stock-alerts")
    public ResponseEntity<List<StockAlertDto>> getStockAlerts() {
        try {
            logger.info("Getting stock alerts");
            List<StockAlertDto> stockAlerts = statsService.getStockAlerts();
            logger.info("Successfully retrieved {} stock alerts", stockAlerts.size());
            return ResponseEntity.ok(stockAlerts);
        } catch (Exception e) {
            logger.error("Error getting stock alerts", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/quick-stats")
    public ResponseEntity<QuickStatsDto> getQuickStats() {
        try {
            logger.info("Getting quick stats");
            QuickStatsDto quickStats = statsService.getQuickStats();
            logger.info("Successfully retrieved quick stats");
            return ResponseEntity.ok(quickStats);
        } catch (Exception e) {
            logger.error("Error getting quick stats", e);
            return ResponseEntity.internalServerError().build();
        }
    }
} 