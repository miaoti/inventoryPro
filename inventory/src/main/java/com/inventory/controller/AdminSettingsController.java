package com.inventory.controller;

import com.inventory.service.AdminSettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/settings")
public class AdminSettingsController {

    @Autowired
    private AdminSettingsService adminSettingsService;

    @GetMapping("/item-display")
    public ResponseEntity<Map<String, Object>> getItemDisplayConfiguration() {
        return ResponseEntity.ok(adminSettingsService.getItemDisplayConfiguration());
    }

    @PostMapping("/item-display")
    public ResponseEntity<String> updateItemDisplayFields(@RequestBody Map<String, List<String>> request) {
        List<String> fields = request.get("fields");
        if (fields == null || fields.isEmpty()) {
            return ResponseEntity.badRequest().body("Fields list cannot be empty");
        }
        
        adminSettingsService.updateItemDisplayFields(fields);
        return ResponseEntity.ok("Item display fields updated successfully");
    }

    @GetMapping("/alert-thresholds")
    public ResponseEntity<Map<String, Object>> getAlertThresholds() {
        return ResponseEntity.ok(adminSettingsService.getAlertThresholds());
    }

    @PostMapping("/alert-thresholds")
    public ResponseEntity<String> updateAlertThresholds(@RequestBody Map<String, Integer> request) {
        Integer warningThreshold = request.get("warningThreshold");
        Integer criticalThreshold = request.get("criticalThreshold");
        
        if (warningThreshold == null || criticalThreshold == null) {
            return ResponseEntity.badRequest().body("Both warningThreshold and criticalThreshold are required");
        }
        
        if (criticalThreshold >= warningThreshold) {
            return ResponseEntity.badRequest().body("Critical threshold must be lower than warning threshold");
        }
        
        if (warningThreshold < 0 || warningThreshold > 200 || criticalThreshold < 0 || criticalThreshold > 200) {
            return ResponseEntity.badRequest().body("Thresholds must be between 0 and 200 percent");
        }
        
        adminSettingsService.updateAlertThresholds(warningThreshold, criticalThreshold);
        return ResponseEntity.ok("Alert thresholds updated successfully");
    }
} 