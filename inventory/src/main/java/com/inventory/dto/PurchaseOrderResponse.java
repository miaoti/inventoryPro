package com.inventory.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrderResponse {
    private Long id;
    private Long itemId;
    private String itemName;
    private Integer quantity;
    private LocalDateTime orderDate;
    private LocalDateTime arrivalDate;
    private String trackingNumber;
    private Boolean arrived;
    private String createdBy;
    private String arrivedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 