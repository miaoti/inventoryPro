package com.inventory.controller;

import com.inventory.dto.UsageRequest;
import com.inventory.entity.Item;
import com.inventory.repository.ItemRepository;
import com.inventory.service.AlertService;
import com.inventory.service.UsageService;
import com.inventory.service.AdminSettingsService;
import com.inventory.service.PurchaseOrderService;
import com.inventory.dto.PurchaseOrderRequest;
import com.inventory.dto.PurchaseOrderResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;

@RestController
@RequestMapping("/public/barcode")
public class PublicBarcodeController {
    
    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private AlertService alertService;

    @Autowired
    private UsageService usageService;

    @Autowired
    private AdminSettingsService adminSettingsService;

    @Autowired
    private PurchaseOrderService purchaseOrderService;

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
        
        // Calculate the actual available quantity - for usage, only current inventory is available 
        // (pending PO can't be used until received)
        int availableQuantity = Math.max(0, item.getCurrentInventory());
        
        // Get admin-configured display fields
        List<String> displayFields = adminSettingsService.getItemDisplayFields();
        
        // Build response with configurable fields
        Map<String, Object> response = buildItemResponse(item, availableQuantity, displayFields);
        
        System.out.println("DEBUG: Response - Current Inventory: " + item.getCurrentInventory() + 
                          ", Available for Usage: " + availableQuantity + 
                          ", Pending PO: " + item.getPendingPO() + 
                          ", Safety Stock: " + item.getSafetyStockThreshold());
        
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
        
        // Always include department information
        response.put("department", item.getDepartment());
        response.put("displayDepartment", item.getDisplayDepartment());
        
        return response;
    }

    @PostMapping("/use")
    public ResponseEntity<?> recordItemUsage(@RequestBody UsageRequest request) {
        try {
            // Debug logging
            System.out.println("=== USAGE REQUEST DEBUG ===");
            System.out.println("Raw request object: " + request);
            System.out.println("Barcode: '" + request.getBarcode() + "' (null: " + (request.getBarcode() == null) + ")");
            System.out.println("UserName: '" + request.getUserName() + "' (null: " + (request.getUserName() == null) + ")");
            System.out.println("QuantityUsed: " + request.getQuantityUsed() + " (null: " + (request.getQuantityUsed() == null) + ")");
            System.out.println("Notes: '" + request.getNotes() + "' (null: " + (request.getNotes() == null) + ")");
            System.out.println("Department: '" + request.getDepartment() + "' (null: " + (request.getDepartment() == null) + ")");
            System.out.println("DNumber: '" + request.getDNumber() + "' (null: " + (request.getDNumber() == null) + ")");
            System.out.println("DNumber is null: " + (request.getDNumber() == null));
            System.out.println("DNumber is empty: " + (request.getDNumber() != null && request.getDNumber().isEmpty()));
            System.out.println("DNumber equals 'null': " + "null".equals(request.getDNumber()));
            
            // Sanitize dNumber - convert "null" string to actual null
            if (request.getDNumber() != null && "null".equals(request.getDNumber().trim())) {
                System.out.println("Converting string 'null' to actual null");
                request.setDNumber(null);
            }
            
            System.out.println("After sanitization - DNumber: '" + request.getDNumber() + "'");
            System.out.println("==========================");
            
            var usage = usageService.recordUsage(request);
            
            // Return updated item info after usage
            Optional<Item> itemOpt = itemRepository.findByBarcode(request.getBarcode());
            if (itemOpt.isPresent()) {
                Item item = itemOpt.get();
                int availableQuantity = Math.max(0, item.getCurrentInventory());
                
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
            System.out.println("ERROR in recordItemUsage: " + e.getMessage());
            e.printStackTrace();
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

    // New PO creation endpoint
    @PostMapping("/create-po/{barcode}")
    public ResponseEntity<?> createPurchaseOrder(@PathVariable String barcode, @RequestBody Map<String, Object> requestData, Authentication authentication) {
        Optional<Item> itemOpt = itemRepository.findByBarcode(barcode);
        
        if (itemOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Item item = itemOpt.get();
        int quantity = (Integer) requestData.getOrDefault("quantity", 0);
        String trackingNumber = (String) requestData.get("trackingNumber");
        
        if (quantity <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Quantity must be greater than 0"));
        }
        
        try {
            PurchaseOrderRequest poRequest = new PurchaseOrderRequest();
            poRequest.setItemId(item.getId());
            poRequest.setQuantity(quantity);
            poRequest.setTrackingNumber(trackingNumber);
            
            String username = authentication != null ? authentication.getName() : null;
            PurchaseOrderResponse poResponse = purchaseOrderService.createPurchaseOrder(poRequest, username);
            
            // Use HashMap for response
            Map<String, Object> poData = new HashMap<>();
            poData.put("id", poResponse.getId());
            poData.put("quantity", poResponse.getQuantity());
            poData.put("orderDate", poResponse.getOrderDate());
            poData.put("trackingNumber", poResponse.getTrackingNumber());
            
            Map<String, Object> itemData = new HashMap<>();
            itemData.put("id", item.getId());
            itemData.put("name", item.getName());
            itemData.put("currentInventory", item.getCurrentInventory());
            itemData.put("pendingPO", purchaseOrderService.getTotalPendingQuantityForItem(item.getId()));
            itemData.put("usedInventory", item.getUsedInventory());
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Purchase Order created successfully");
            response.put("purchaseOrder", poData);
            response.put("item", itemData);
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Get pending POs for an item
    @GetMapping("/pending-pos/{barcode}")
    public ResponseEntity<?> getPendingPurchaseOrders(@PathVariable String barcode) {
        Optional<Item> itemOpt = itemRepository.findByBarcode(barcode);
        
        if (itemOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Item item = itemOpt.get();
        List<PurchaseOrderResponse> pendingPOs = purchaseOrderService.getPendingPurchaseOrdersByItem(item.getId());
        
        return ResponseEntity.ok(Map.of("pendingPurchaseOrders", pendingPOs));
    }

    // Mark a specific PO as arrived
    @PostMapping("/arrive-po/{purchaseOrderId}")
    public ResponseEntity<?> markPurchaseOrderAsArrived(@PathVariable Long purchaseOrderId, Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : null;
            PurchaseOrderResponse poResponse = purchaseOrderService.markAsArrived(purchaseOrderId, username);
            
            // Get updated item data
            Optional<Item> itemOpt = itemRepository.findById(poResponse.getItemId());
            if (itemOpt.isPresent()) {
                Item item = itemOpt.get();
                Map<String, Object> itemData = new HashMap<>();
                itemData.put("id", item.getId());
                itemData.put("name", item.getName());
                itemData.put("currentInventory", item.getCurrentInventory());
                itemData.put("pendingPO", purchaseOrderService.getTotalPendingQuantityForItem(item.getId()));
                itemData.put("usedInventory", item.getUsedInventory());
                
                Map<String, Object> response = new HashMap<>();
                response.put("message", "Purchase Order marked as arrived successfully");
                response.put("item", itemData);
                response.put("arrivedQuantity", poResponse.getQuantity());
                
                return ResponseEntity.ok(response);
            }
            
            return ResponseEntity.ok(Map.of("message", "Purchase Order marked as arrived successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Legacy endpoint for backward compatibility
    @PostMapping("/add-pending-po/{barcode}")
    public ResponseEntity<?> addPendingPO(@PathVariable String barcode, @RequestBody Map<String, Integer> requestData, Authentication authentication) {
        Optional<Item> itemOpt = itemRepository.findByBarcode(barcode);
        
        if (itemOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Item item = itemOpt.get();
        int pendingQuantity = requestData.getOrDefault("quantity", 0);
        
        // Create a proper PO instead of just updating the pending count
        try {
            PurchaseOrderRequest poRequest = new PurchaseOrderRequest();
            poRequest.setItemId(item.getId());
            poRequest.setQuantity(pendingQuantity);
            
            String username = authentication != null ? authentication.getName() : null;
            PurchaseOrderResponse poResponse = purchaseOrderService.createPurchaseOrder(poRequest, username);
            
            // Use HashMap for response
            Map<String, Object> itemData = new HashMap<>();
            itemData.put("id", item.getId());
            itemData.put("name", item.getName());
            itemData.put("currentInventory", item.getCurrentInventory());
            itemData.put("pendingPO", purchaseOrderService.getTotalPendingQuantityForItem(item.getId()));
            itemData.put("usedInventory", item.getUsedInventory());
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Pending PO added successfully");
            response.put("item", itemData);
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/confirm-restock/{barcode}")
    public ResponseEntity<?> confirmRestock(@PathVariable String barcode, @RequestBody Map<String, Object> requestData, Authentication authentication) {
        Optional<Item> itemOpt = itemRepository.findByBarcode(barcode);
        
        if (itemOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Item item = itemOpt.get();
        
        // Check if there's a specific PO ID to mark as arrived
        Long purchaseOrderId = null;
        if (requestData.containsKey("purchaseOrderId")) {
            purchaseOrderId = Long.valueOf(requestData.get("purchaseOrderId").toString());
        }
        
        try {
            if (purchaseOrderId != null) {
                // Mark specific PO as arrived
                String username = authentication != null ? authentication.getName() : null;
                PurchaseOrderResponse poResponse = purchaseOrderService.markAsArrived(purchaseOrderId, username);
                
                Map<String, Object> itemData = new HashMap<>();
                itemData.put("id", item.getId());
                itemData.put("name", item.getName());
                itemData.put("currentInventory", item.getCurrentInventory());
                itemData.put("pendingPO", purchaseOrderService.getTotalPendingQuantityForItem(item.getId()));
                itemData.put("usedInventory", item.getUsedInventory());
                
                Map<String, Object> response = new HashMap<>();
                response.put("message", "Purchase Order received successfully");
                response.put("item", itemData);
                response.put("receivedQuantity", poResponse.getQuantity());
                
                return ResponseEntity.ok(response);
            } else {
                // Legacy behavior: just add to inventory for manual restock
                int receivedQuantity = (Integer) requestData.getOrDefault("quantity", 0);
                
                if (receivedQuantity <= 0) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Quantity must be greater than 0"));
                }
                
                item.setCurrentInventory(item.getCurrentInventory() + receivedQuantity);
                itemRepository.save(item);
                
                // Check alerts after restock
                alertService.checkAndCreateSafetyStockAlert(item);
                
                Map<String, Object> itemData = new HashMap<>();
                itemData.put("id", item.getId());
                itemData.put("name", item.getName());
                itemData.put("currentInventory", item.getCurrentInventory());
                itemData.put("pendingPO", purchaseOrderService.getTotalPendingQuantityForItem(item.getId()));
                itemData.put("usedInventory", item.getUsedInventory());
                
                Map<String, Object> response = new HashMap<>();
                response.put("message", "Manual restock confirmed successfully");
                response.put("item", itemData);
                
                return ResponseEntity.ok(response);
            }
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
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