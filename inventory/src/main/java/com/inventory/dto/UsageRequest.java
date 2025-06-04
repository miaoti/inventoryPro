package com.inventory.dto;

import lombok.Data;

@Data
public class UsageRequest {
    private String barcode;
    private String userName;
    private Integer quantityUsed;
    private String notes;
    private String department;
    private String dNumber;
} 