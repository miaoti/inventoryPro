package com.inventory.controller;

import com.inventory.entity.Item;
import com.inventory.repository.ItemRepository;
import com.inventory.dto.UsageRequest;
import com.inventory.service.UsageService;
import com.inventory.service.AdminSettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.Map;
import java.util.HashMap;
import java.util.List;

@RestController
@RequestMapping("/public/qr")
public class PublicQRController {
    
    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private UsageService usageService;

    @Autowired
    private AdminSettingsService adminSettingsService;

    @GetMapping("/item/{qrCodeId}")
    public ResponseEntity<?> getItemByQRCode(@PathVariable String qrCodeId) {
        try {
            Optional<Item> itemOpt = itemRepository.findByQrCodeId(qrCodeId);
            
            if (itemOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Item item = itemOpt.get();
            
            // Calculate the actual available quantity
            int availableQuantity = Math.max(0, item.getCurrentInventory());
            
            // Get admin-configured display fields
            List<String> displayFields = adminSettingsService.getItemDisplayFields();
            
            // Build response with configurable fields
            Map<String, Object> response = buildItemResponse(item, availableQuantity, displayFields);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error getting item by QR code: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(
                Map.of("error", "Failed to get item information")
            );
        }
    }

    @PostMapping("/use/{qrCodeId}")
    public ResponseEntity<?> recordUsageByQRCode(@PathVariable String qrCodeId, @RequestBody Map<String, Object> requestData) {
        try {
            Optional<Item> itemOpt = itemRepository.findByQrCodeId(qrCodeId);
            
            if (itemOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Item item = itemOpt.get();
            
            // Create usage request
            UsageRequest usageRequest = new UsageRequest();
            usageRequest.setBarcode(item.getBarcode() != null ? item.getBarcode() : item.getCode());
            usageRequest.setUserName(requestData.get("userName").toString());
            usageRequest.setQuantityUsed(Integer.valueOf(requestData.get("quantityUsed").toString()));
            usageRequest.setNotes(requestData.get("notes") != null ? requestData.get("notes").toString() : null);
            usageRequest.setDepartment(requestData.get("department") != null ? requestData.get("department").toString() : null);
            usageRequest.setDNumber(requestData.get("dNumber") != null ? requestData.get("dNumber").toString() : null);
            
            // Record usage
            var usage = usageService.recordUsage(usageRequest);
            
            // Return updated item info
            Item updatedItem = itemRepository.findById(item.getId()).orElse(item);
            int availableQuantity = Math.max(0, updatedItem.getCurrentInventory());
            
            Map<String, Object> usageData = new HashMap<>();
            usageData.put("id", usage.getId());
            usageData.put("userName", usage.getUserName());
            usageData.put("quantityUsed", usage.getQuantityUsed());
            usageData.put("usedAt", usage.getUsedAt());

            Map<String, Object> itemData = new HashMap<>();
            itemData.put("id", updatedItem.getId());
            itemData.put("name", updatedItem.getName());
            itemData.put("currentInventory", updatedItem.getCurrentInventory());
            itemData.put("usedInventory", updatedItem.getUsedInventory());
            itemData.put("availableQuantity", availableQuantity);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Usage recorded successfully");
            response.put("usage", usageData);
            response.put("item", itemData);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            System.err.println("Error recording usage by QR code: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(
                Map.of("error", "Failed to record usage")
            );
        }
    }

    private Map<String, Object> buildItemResponse(Item item, int availableQuantity, List<String> displayFields) {
        Map<String, Object> response = new HashMap<>();
        
        // Always include essential fields for functionality
        response.put("id", item.getId());
        response.put("availableQuantity", availableQuantity);
        response.put("needsRestock", item.needsRestock());
        response.put("qrCodeId", item.getQrCodeId());
        
        // Add configurable display fields
        for (String field : displayFields) {
            switch (field) {
                case "name":
                    response.put("name", item.getName());
                    break;
                case "code":
                    response.put("code", item.getCode());
                    break;
                case "description":
                    response.put("description", item.getDescription());
                    break;
                case "englishDescription":
                    response.put("englishDescription", item.getEnglishDescription());
                    break;
                case "location":
                    response.put("location", item.getLocation());
                    break;
                case "equipment":
                    response.put("equipment", item.getEquipment());
                    break;
                case "category":
                    response.put("category", item.getCategory());
                    break;
                case "currentInventory":
                    response.put("currentInventory", item.getCurrentInventory());
                    break;
                case "safetyStockThreshold":
                    response.put("safetyStockThreshold", item.getSafetyStockThreshold());
                    break;
                case "barcode":
                    response.put("barcode", item.getBarcode());
                    break;
            }
        }
        
        // Always include these for backward compatibility and essential functionality
        response.put("usedInventory", item.getUsedInventory());
        response.put("pendingPO", item.getPendingPO());
        
        return response;
    }
} 