package com.inventory.dto;

import lombok.Data;

@Data
public class ItemCreateRequest {
    private String name;
    private String code;
    private Integer quantity;
    private Integer minQuantity;
    private String location;
} 