package com.inventory.controller;

import com.inventory.dto.UsageRequest;
import com.inventory.entity.Item;
import com.inventory.repository.ItemRepository;
import com.inventory.service.AlertService;
import com.inventory.service.UsageService;
import com.inventory.service.AdminSettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;

@RestController
@RequestMapping("/public/barcode")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class PublicBarcodeController {
    
    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private AlertService alertService;

    @Autowired
    private UsageService usageService;

    @Autowired
    private AdminSettingsService adminSettingsService;

    @GetMapping("/scan/{barcode}")
    public ResponseEntity<?> scanBarcode(@PathVariable String barcode) {
        System.out.println("DEBUG: Scanning for input: " + barcode);
        
        // First try to find by barcode
        Optional<Item> itemOpt = itemRepository.findByBarcode(barcode);
        System.out.println("DEBUG: Search by barcode '" + barcode + "' found: " + itemOpt.isPresent());
        
        // If not found by barcode, try to find by item code
        if (itemOpt.isEmpty()) {
            String upperCaseCode = barcode.toUpperCase();
            System.out.println("DEBUG: Searching by item code: " + upperCaseCode);
            itemOpt = itemRepository.findByCode(upperCaseCode);
            System.out.println("DEBUG: Search by code '" + upperCaseCode + "' found: " + itemOpt.isPresent());
        }
        
        if (itemOpt.isEmpty()) {
            System.out.println("DEBUG: No item found for input: " + barcode);
            return ResponseEntity.notFound().build();
        }
        
        Item item = itemOpt.get();
        System.out.println("DEBUG: Found item - ID: " + item.getId() + ", Name: " + item.getName() + ", Code: " + item.getCode() + ", Barcode: " + item.getBarcode());
        
        // Calculate the actual available quantity - currentInventory already reflects usage, so just add pending PO
        int availableQuantity = Math.max(0, item.getCurrentInventory() + item.getPendingPO());
        
        // Get admin-configured display fields
        List<String> displayFields = adminSettingsService.getItemDisplayFields();
        
        // Build response with configurable fields
        Map<String, Object> response = buildItemResponse(item, availableQuantity, displayFields);
        
        return ResponseEntity.ok(response);
    }

    private Map<String, Object> buildItemResponse(Item item, int availableQuantity, List<String> displayFields) {
        Map<String, Object> response = new HashMap<>();
        
        // Always include essential fields for functionality
        response.put("id", item.getId());
        response.put("availableQuantity", availableQuantity);
        response.put("needsRestock", item.needsRestock());
        
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
                case "status":
                    response.put("status", item.getStatus());
                    break;
                case "currentInventory":
                    response.put("currentInventory", item.getCurrentInventory());
                    break;
                case "safetyStockThreshold":
                    response.put("safetyStockThreshold", item.getSafetyStockThreshold());
                    break;
                case "estimatedConsumption":
                    response.put("estimatedConsumption", item.getEstimatedConsumption());
                    break;
                case "rack":
                    response.put("rack", item.getRack());
                    break;
                case "floor":
                    response.put("floor", item.getFloor());
                    break;
                case "area":
                    response.put("area", item.getArea());
                    break;
                case "bin":
                    response.put("bin", item.getBin());
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

    @PostMapping("/use")
    public ResponseEntity<?> recordItemUsage(@RequestBody UsageRequest request) {
        try {
            var usage = usageService.recordUsage(request);
            
            // Return updated item info after usage
            Optional<Item> itemOpt = itemRepository.findByBarcode(request.getBarcode());
            if (itemOpt.isPresent()) {
                Item item = itemOpt.get();
                int availableQuantity = Math.max(0, item.getCurrentInventory() + item.getPendingPO());
                
                // Use HashMap to avoid Map.of() limits
                Map<String, Object> usageData = new HashMap<>();
                usageData.put("id", usage.getId());
                usageData.put("userName", usage.getUserName());
                usageData.put("quantityUsed", usage.getQuantityUsed());
                usageData.put("usedAt", usage.getUsedAt());
                
                Map<String, Object> itemData = new HashMap<>();
                itemData.put("id", item.getId());
                itemData.put("name", item.getName());
                itemData.put("currentInventory", item.getCurrentInventory());
                itemData.put("usedInventory", item.getUsedInventory());
                itemData.put("pendingPO", item.getPendingPO());
                itemData.put("availableQuantity", availableQuantity);
                
                Map<String, Object> response = new HashMap<>();
                response.put("message", "Usage recorded successfully");
                response.put("usage", usageData);
                response.put("item", itemData);
                
                return ResponseEntity.ok(response);
            }
            return ResponseEntity.ok(Map.of("message", "Usage recorded successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Legacy endpoint for backward compatibility
    @PostMapping("/use/{barcode}")
    public ResponseEntity<?> useItem(@PathVariable String barcode, @RequestBody Map<String, Object> requestData) {
        try {
            Optional<Item> itemOpt = itemRepository.findByBarcode(barcode);
            
            if (itemOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Item item = itemOpt.get();
            int quantityToUse = (Integer) requestData.getOrDefault("quantity", 1);
            String userName = (String) requestData.getOrDefault("userName", "Unknown User");
            String notes = (String) requestData.getOrDefault("notes", "");
            
            // Create usage request
            UsageRequest usageRequest = new UsageRequest();
            usageRequest.setBarcode(barcode);
            usageRequest.setUserName(userName);
            usageRequest.setQuantityUsed(quantityToUse);
            usageRequest.setNotes(notes);
            
            var usage = usageService.recordUsage(usageRequest);
            
            // Use HashMap to avoid Map.of() limits
            Map<String, Object> itemData = new HashMap<>();
            itemData.put("id", item.getId());
            itemData.put("name", item.getName());
            itemData.put("currentInventory", item.getCurrentInventory());
            itemData.put("usedInventory", item.getUsedInventory());
            
            Map<String, Object> usageData = new HashMap<>();
            usageData.put("userName", usage.getUserName());
            usageData.put("quantityUsed", usage.getQuantityUsed());
            usageData.put("usedAt", usage.getUsedAt());
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Item usage recorded successfully");
            response.put("item", itemData);
            response.put("usage", usageData);
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/add-pending-po/{barcode}")
    public ResponseEntity<?> addPendingPO(@PathVariable String barcode, @RequestBody Map<String, Integer> requestData) {
        Optional<Item> itemOpt = itemRepository.findByBarcode(barcode);
        
        if (itemOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Item item = itemOpt.get();
        int pendingQuantity = requestData.getOrDefault("quantity", 0);
        
        item.setPendingPO(item.getPendingPO() + pendingQuantity);
        itemRepository.save(item);
        
        // Check alerts after updating pending PO
        alertService.checkAndCreateSafetyStockAlert(item);
        
        // Use HashMap for response
        Map<String, Object> itemData = new HashMap<>();
        itemData.put("id", item.getId());
        itemData.put("name", item.getName());
        itemData.put("currentInventory", item.getCurrentInventory());
        itemData.put("pendingPO", item.getPendingPO());
        itemData.put("usedInventory", item.getUsedInventory());
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Pending PO added successfully");
        response.put("item", itemData);
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/confirm-restock/{barcode}")
    public ResponseEntity<?> confirmRestock(@PathVariable String barcode, @RequestBody Map<String, Integer> requestData) {
        Optional<Item> itemOpt = itemRepository.findByBarcode(barcode);
        
        if (itemOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Item item = itemOpt.get();
        int receivedQuantity = requestData.getOrDefault("quantity", 0);
        
        // Add to current inventory and reduce from pending PO
        item.setCurrentInventory(item.getCurrentInventory() + receivedQuantity);
        item.setPendingPO(Math.max(0, item.getPendingPO() - receivedQuantity));
        itemRepository.save(item);
        
        // Check alerts after restock
        alertService.checkAndCreateSafetyStockAlert(item);
        
        // Use HashMap for response
        Map<String, Object> itemData = new HashMap<>();
        itemData.put("id", item.getId());
        itemData.put("name", item.getName());
        itemData.put("currentInventory", item.getCurrentInventory());
        itemData.put("pendingPO", item.getPendingPO());
        itemData.put("usedInventory", item.getUsedInventory());
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Restock confirmed successfully");
        response.put("item", itemData);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/debug/items")
    public ResponseEntity<?> debugItems() {
        List<Item> allItems = itemRepository.findAll();
        Map<String, Object> response = new HashMap<>();
        
        List<Map<String, Object>> itemList = new ArrayList<>();
        for (Item item : allItems) {
            Map<String, Object> itemInfo = new HashMap<>();
            itemInfo.put("id", item.getId());
            itemInfo.put("name", item.getName());
            itemInfo.put("code", item.getCode());
            itemInfo.put("barcode", item.getBarcode());
            itemList.add(itemInfo);
        }
        
        response.put("totalItems", allItems.size());
        response.put("items", itemList);
        
        return ResponseEntity.ok(response);
    }
} 