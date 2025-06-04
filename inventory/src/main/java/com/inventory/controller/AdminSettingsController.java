package com.inventory.controller;

import com.inventory.service.AdminSettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/settings")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
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
} 