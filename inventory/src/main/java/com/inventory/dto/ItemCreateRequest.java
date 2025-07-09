package com.inventory.dto;

import lombok.Data;
import com.inventory.entity.Item.ABCCategory;

@Data
public class ItemCreateRequest {
    private String name;
    private String description;
    private String englishDescription;
    private String code;
    private Integer quantity;
    private Integer minQuantity;
    private Integer pendingPO;
    private String location;
    private String equipment;
    private ABCCategory category;
    private String department; // Department that owns this item (null/empty = Public)
    private String weeklyData; // JSON string for dynamic weekly data
} 