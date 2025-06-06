package com.inventory.service;

import com.inventory.entity.AdminSettings;
import com.inventory.repository.AdminSettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AdminSettingsService {

    @Autowired
    private AdminSettingsRepository adminSettingsRepository;

    public static final String ITEM_DISPLAY_FIELDS_KEY = "item_display_fields";
    public static final String WARNING_THRESHOLD_KEY = "warning_threshold";
    public static final String CRITICAL_THRESHOLD_KEY = "critical_threshold";
    
    // Default fields to display in Record Item Usage
    private static final String DEFAULT_DISPLAY_FIELDS = "name,code,location,currentInventory,category,equipment";
    
    // Default alert thresholds (as percentages of safety stock)
    private static final int DEFAULT_WARNING_THRESHOLD = 100;  // 100% of safety stock
    private static final int DEFAULT_CRITICAL_THRESHOLD = 50;  // 50% of safety stock

    public List<String> getItemDisplayFields() {
        Optional<AdminSettings> setting = adminSettingsRepository.findBySettingKey(ITEM_DISPLAY_FIELDS_KEY);
        if (setting.isPresent()) {
            return Arrays.asList(setting.get().getSettingValue().split(","));
        } else {
            // Create default setting if it doesn't exist
            createDefaultItemDisplaySetting();
            return Arrays.asList(DEFAULT_DISPLAY_FIELDS.split(","));
        }
    }

    public void updateItemDisplayFields(List<String> fields) {
        String fieldsValue = String.join(",", fields);
        Optional<AdminSettings> existing = adminSettingsRepository.findBySettingKey(ITEM_DISPLAY_FIELDS_KEY);
        
        if (existing.isPresent()) {
            AdminSettings setting = existing.get();
            setting.setSettingValue(fieldsValue);
            adminSettingsRepository.save(setting);
        } else {
            AdminSettings newSetting = new AdminSettings(
                ITEM_DISPLAY_FIELDS_KEY, 
                fieldsValue, 
                "Fields to display in Record Item Usage page when an item is scanned"
            );
            adminSettingsRepository.save(newSetting);
        }
    }

    private void createDefaultItemDisplaySetting() {
        AdminSettings defaultSetting = new AdminSettings(
            ITEM_DISPLAY_FIELDS_KEY,
            DEFAULT_DISPLAY_FIELDS,
            "Fields to display in Record Item Usage page when an item is scanned"
        );
        adminSettingsRepository.save(defaultSetting);
    }

    public Map<String, String> getAvailableFields() {
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("name", "Item Name");
        fields.put("code", "Item Code");
        fields.put("description", "Description");
        fields.put("englishDescription", "English Description");
        fields.put("location", "Location");
        fields.put("equipment", "Equipment");
        fields.put("category", "ABC Category");
        fields.put("currentInventory", "Current Inventory");
        fields.put("safetyStockThreshold", "Safety Stock");
        fields.put("availableQuantity", "Available Quantity");
        fields.put("barcode", "Barcode");
        return fields;
    }

    public Map<String, Object> getItemDisplayConfiguration() {
        Map<String, Object> config = new HashMap<>();
        config.put("selectedFields", getItemDisplayFields());
        config.put("availableFields", getAvailableFields());
        return config;
    }

    // Alert Threshold Methods
    
    public Map<String, Object> getAlertThresholds() {
        Map<String, Object> thresholds = new HashMap<>();
        thresholds.put("warningThreshold", getWarningThreshold());
        thresholds.put("criticalThreshold", getCriticalThreshold());
        return thresholds;
    }
    
    public int getWarningThreshold() {
        Optional<AdminSettings> setting = adminSettingsRepository.findBySettingKey(WARNING_THRESHOLD_KEY);
        if (setting.isPresent()) {
            try {
                return Integer.parseInt(setting.get().getSettingValue());
            } catch (NumberFormatException e) {
                return DEFAULT_WARNING_THRESHOLD;
            }
        } else {
            createDefaultAlertThresholds();
            return DEFAULT_WARNING_THRESHOLD;
        }
    }
    
    public int getCriticalThreshold() {
        Optional<AdminSettings> setting = adminSettingsRepository.findBySettingKey(CRITICAL_THRESHOLD_KEY);
        if (setting.isPresent()) {
            try {
                return Integer.parseInt(setting.get().getSettingValue());
            } catch (NumberFormatException e) {
                return DEFAULT_CRITICAL_THRESHOLD;
            }
        } else {
            createDefaultAlertThresholds();
            return DEFAULT_CRITICAL_THRESHOLD;
        }
    }
    
    public void updateAlertThresholds(int warningThreshold, int criticalThreshold) {
        // Update warning threshold
        Optional<AdminSettings> warningExisting = adminSettingsRepository.findBySettingKey(WARNING_THRESHOLD_KEY);
        if (warningExisting.isPresent()) {
            AdminSettings setting = warningExisting.get();
            setting.setSettingValue(String.valueOf(warningThreshold));
            adminSettingsRepository.save(setting);
        } else {
            AdminSettings newSetting = new AdminSettings(
                WARNING_THRESHOLD_KEY,
                String.valueOf(warningThreshold),
                "Warning threshold percentage for stock alerts"
            );
            adminSettingsRepository.save(newSetting);
        }
        
        // Update critical threshold
        Optional<AdminSettings> criticalExisting = adminSettingsRepository.findBySettingKey(CRITICAL_THRESHOLD_KEY);
        if (criticalExisting.isPresent()) {
            AdminSettings setting = criticalExisting.get();
            setting.setSettingValue(String.valueOf(criticalThreshold));
            adminSettingsRepository.save(setting);
        } else {
            AdminSettings newSetting = new AdminSettings(
                CRITICAL_THRESHOLD_KEY,
                String.valueOf(criticalThreshold),
                "Critical threshold percentage for stock alerts"
            );
            adminSettingsRepository.save(newSetting);
        }
    }
    
    private void createDefaultAlertThresholds() {
        // Create warning threshold if it doesn't exist
        if (!adminSettingsRepository.findBySettingKey(WARNING_THRESHOLD_KEY).isPresent()) {
            AdminSettings warningSetting = new AdminSettings(
                WARNING_THRESHOLD_KEY,
                String.valueOf(DEFAULT_WARNING_THRESHOLD),
                "Warning threshold percentage for stock alerts"
            );
            adminSettingsRepository.save(warningSetting);
        }
        
        // Create critical threshold if it doesn't exist
        if (!adminSettingsRepository.findBySettingKey(CRITICAL_THRESHOLD_KEY).isPresent()) {
            AdminSettings criticalSetting = new AdminSettings(
                CRITICAL_THRESHOLD_KEY,
                String.valueOf(DEFAULT_CRITICAL_THRESHOLD),
                "Critical threshold percentage for stock alerts"
            );
            adminSettingsRepository.save(criticalSetting);
        }
    }
} 