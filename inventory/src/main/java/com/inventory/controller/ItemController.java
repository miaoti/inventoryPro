package com.inventory.controller;

import com.inventory.dto.ItemCreateRequest;
import com.inventory.dto.ItemResponse;
import com.inventory.entity.Item;
import com.inventory.repository.ItemRepository;
import com.inventory.service.BarcodeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/items")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class ItemController {
    @Autowired
    private ItemRepository itemRepository;
    
    @Autowired
    private BarcodeService barcodeService;

    @GetMapping
    public List<ItemResponse> getAllItems() {
        return itemRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ItemResponse> getItemById(@PathVariable Long id) {
        Optional<Item> item = itemRepository.findById(id);
        return item.map(i -> ResponseEntity.ok(convertToResponse(i)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ItemResponse createItem(@RequestBody ItemCreateRequest request) {
        // Validate required fields
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new RuntimeException("Item name is required");
        }
        if (request.getCode() == null || request.getCode().trim().isEmpty()) {
            throw new RuntimeException("Item code is required");
        }

        Item item = new Item();
        item.setName(request.getName());
        item.setCode(request.getCode().trim().toUpperCase()); // Use provided code, uppercase for consistency
        item.setCurrentInventory(request.getQuantity() != null ? request.getQuantity() : 0);
        item.setSafetyStockThreshold(request.getMinQuantity() != null ? request.getMinQuantity() : 0);
        item.setLocation(request.getLocation());
        item.setDescription(""); // Default empty description
        
        // Generate barcode based on the provided code
        item.setBarcode(generateBarcodeFromCode(request.getCode()));
        
        Item savedItem = itemRepository.save(item);
        return convertToResponse(savedItem);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ItemResponse> updateItem(@PathVariable Long id, @RequestBody ItemCreateRequest request) {
        Optional<Item> optionalItem = itemRepository.findById(id);
        if (optionalItem.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        // Validate required fields
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new RuntimeException("Item name is required");
        }
        if (request.getCode() == null || request.getCode().trim().isEmpty()) {
            throw new RuntimeException("Item code is required");
        }

        Item item = optionalItem.get();
        item.setName(request.getName());
        item.setCode(request.getCode().trim().toUpperCase()); // Use provided code
        item.setCurrentInventory(request.getQuantity() != null ? request.getQuantity() : 0);
        item.setSafetyStockThreshold(request.getMinQuantity() != null ? request.getMinQuantity() : 0);
        item.setLocation(request.getLocation());
        
        // Update barcode if code changed
        if (!item.getBarcode().equals(generateBarcodeFromCode(request.getCode()))) {
            item.setBarcode(generateBarcodeFromCode(request.getCode()));
        }
        
        Item savedItem = itemRepository.save(item);
        return ResponseEntity.ok(convertToResponse(savedItem));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        if (!itemRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        itemRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private String generateBarcodeFromCode(String code) {
        // Generate a barcode based on the item code
        // Using a deterministic approach for consistency
        String cleanCode = code.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        
        if (cleanCode.length() >= 8) {
            // If code is long enough, use it directly with a checksum
            int checksum = cleanCode.hashCode() % 1000;
            return cleanCode.substring(0, 8) + String.format("%03d", Math.abs(checksum));
        } else {
            // For shorter codes, pad with hash and timestamp
            int codeHash = Math.abs(cleanCode.hashCode());
            String paddedHash = String.format("%06d", codeHash % 1000000);
            long timestamp = System.currentTimeMillis();
            String timeComponent = String.valueOf(timestamp).substring(7); // Last 6 digits
            
            return cleanCode + paddedHash.substring(0, Math.max(0, 11 - cleanCode.length())) + timeComponent.substring(0, Math.min(timeComponent.length(), 3));
        }
    }

    private String generateItemCode(String name) {
        // Keep this method for backward compatibility but it shouldn't be used for new items
        if (name == null || name.trim().isEmpty()) {
            return "ITEM_" + System.currentTimeMillis();
        }
        return name.replaceAll("[^a-zA-Z0-9]", "").toUpperCase().substring(0, Math.min(name.length(), 8)) + "_" + System.currentTimeMillis() % 10000;
    }

    private ItemResponse convertToResponse(Item item) {
        // Calculate used inventory from usage records
        Integer usedInventory = item.getUsedInventory() != null ? item.getUsedInventory() : 0;
        
        // Get pending PO (for now, defaulting to 0 - can be enhanced later)
        Integer pendingPO = item.getPendingPO() != null ? item.getPendingPO() : 0;
        
        // Calculate available quantity - currentInventory already reflects usage, so just add pending PO
        Integer currentInventory = item.getCurrentInventory() != null ? item.getCurrentInventory() : 0;
        Integer availableQuantity = Math.max(0, currentInventory + pendingPO);
        
        // Check if needs restock
        Integer safetyStock = item.getSafetyStockThreshold() != null ? item.getSafetyStockThreshold() : 0;
        boolean needsRestock = availableQuantity <= safetyStock;
        
        ItemResponse response = new ItemResponse();
        response.setId(item.getId());
        response.setName(item.getName());
        response.setCode(item.getCode());
        response.setQuantity(currentInventory);
        response.setMinQuantity(safetyStock);
        response.setLocation(item.getLocation());
        response.setBarcode(item.getBarcode());
        response.setUsedInventory(usedInventory);
        response.setPendingPO(pendingPO);
        response.setAvailableQuantity(availableQuantity);
        response.setNeedsRestock(needsRestock);
        
        return response;
    }
} 