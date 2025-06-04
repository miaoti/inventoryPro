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
} 