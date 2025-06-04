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
    
    // Default fields to display in Record Item Usage
    private static final String DEFAULT_DISPLAY_FIELDS = "name,code,location,currentInventory,category,equipment";

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
        fields.put("status", "Status");
        fields.put("currentInventory", "Current Inventory");
        fields.put("safetyStockThreshold", "Safety Stock");
        fields.put("availableQuantity", "Available Quantity");
        fields.put("estimatedConsumption", "Estimated Consumption");
        fields.put("rack", "Rack");
        fields.put("floor", "Floor");
        fields.put("area", "Area");
        fields.put("bin", "Bin");
        fields.put("barcode", "Barcode");
        return fields;
    }

    public Map<String, Object> getItemDisplayConfiguration() {
        Map<String, Object> config = new HashMap<>();
        config.put("selectedFields", getItemDisplayFields());
        config.put("availableFields", getAvailableFields());
        return config;
    }
} 