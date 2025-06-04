package com.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.inventory.entity.Item.ABCCategory;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ItemResponse {
    private Long id;
    private String name;
    private String description;
    private String englishDescription;
    private String code;
    private Integer quantity; // Current inventory
    private Integer minQuantity; // Safety stock threshold
    private String location;
    private String equipment;
    private ABCCategory category;
    private String status;
    private Integer estimatedConsumption;
    private String rack;
    private String floor;
    private String area;
    private String bin;
    private String weeklyData; // JSON string for dynamic weekly data
    private String barcode;
    private Integer usedInventory; // Total used inventory
    private Integer pendingPO; // Pending purchase orders
    private Integer availableQuantity; // Calculated: quantity + pendingPO - usedInventory
    private boolean needsRestock; // true if available quantity <= minQuantity

    public ItemResponse(Long id, String name, Integer quantity, Integer minQuantity, String location, String barcode) {
        this.id = id;
        this.name = name;
        this.quantity = quantity;
        this.minQuantity = minQuantity;
        this.location = location;
        this.barcode = barcode;
    }
} 