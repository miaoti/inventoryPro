package com.inventory.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PurchaseOrderRequest {
    private Long itemId;
    private Integer quantity;
    private LocalDateTime orderDate;
    private String trackingNumber;
} 