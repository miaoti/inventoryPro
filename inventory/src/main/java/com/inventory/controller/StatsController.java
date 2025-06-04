package com.inventory.controller;

import com.inventory.dto.*;
import com.inventory.service.StatsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/stats")
@CrossOrigin(origins = "*")
public class StatsController {

    @Autowired
    private StatsService statsService;

    @GetMapping("/daily-usage")
    public ResponseEntity<List<DailyUsageDto>> getDailyUsage(
            @RequestParam(defaultValue = "7") int days) {
        try {
            List<DailyUsageDto> dailyUsage = statsService.getDailyUsage(days);
            return ResponseEntity.ok(dailyUsage);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/top-usage")
    public ResponseEntity<List<TopUsageItemDto>> getTopUsageItems(
            @RequestParam(defaultValue = "5") int limit) {
        try {
            List<TopUsageItemDto> topItems = statsService.getTopUsageItems(limit);
            return ResponseEntity.ok(topItems);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<LowStockItemDto>> getLowStockItems() {
        try {
            List<LowStockItemDto> lowStockItems = statsService.getLowStockItems();
            return ResponseEntity.ok(lowStockItems);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/stock-alerts")
    public ResponseEntity<List<StockAlertDto>> getStockAlerts() {
        try {
            List<StockAlertDto> stockAlerts = statsService.getStockAlerts();
            return ResponseEntity.ok(stockAlerts);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/quick-stats")
    public ResponseEntity<QuickStatsDto> getQuickStats() {
        try {
            QuickStatsDto quickStats = statsService.getQuickStats();
            return ResponseEntity.ok(quickStats);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
} 