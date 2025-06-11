package com.inventory.controller;

import com.inventory.entity.Item;
import com.inventory.repository.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/public/items")
public class PublicItemsController {
    
    @Autowired
    private ItemRepository itemRepository;

    @GetMapping("/search")
    public ResponseEntity<?> searchItems() {
        try {
            List<Item> items = itemRepository.findAll();
            List<Map<String, Object>> itemsData = new ArrayList<>();
            
            for (Item item : items) {
                Map<String, Object> itemData = new HashMap<>();
                itemData.put("id", item.getId());
                itemData.put("name", item.getName());
                itemData.put("code", item.getCode());
                itemData.put("description", item.getDescription());
                itemData.put("englishDescription", item.getEnglishDescription());
                itemData.put("location", item.getLocation());
                itemData.put("equipment", item.getEquipment());
                itemData.put("category", item.getCategory());
                itemData.put("barcode", item.getBarcode());
                itemData.put("currentInventory", item.getCurrentInventory());
                itemsData.add(itemData);
            }
            
            return ResponseEntity.ok(itemsData);
        } catch (Exception e) {
            System.err.println("Error in public items search: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(
                Map.of("error", "Failed to search items: " + e.getMessage())
            );
        }
    }
} 