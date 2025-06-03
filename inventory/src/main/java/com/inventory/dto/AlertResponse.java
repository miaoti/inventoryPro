package com.inventory.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AlertResponse {
    private Long id;
    private ItemSummary item;
    private String alertType;
    private String message;
    private Integer currentInventory;
    private Integer pendingPO;
    private Integer usedInventory;
    private Integer safetyStockThreshold;
    private Boolean resolved;
    private Boolean read;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime readAt;

    @Data
    public static class ItemSummary {
        private Long id;
        private String name;
        private String code;
        private String barcode;
    }

    public AlertResponse(Long id, ItemSummary item, String alertType, String message, 
                        Integer currentInventory, Integer pendingPO, Integer usedInventory, 
                        Integer safetyStockThreshold, Boolean resolved, Boolean read,
                        LocalDateTime createdAt, LocalDateTime resolvedAt, LocalDateTime readAt) {
        this.id = id;
        this.item = item;
        this.alertType = alertType;
        this.message = message;
        this.currentInventory = currentInventory;
        this.pendingPO = pendingPO;
        this.usedInventory = usedInventory;
        this.safetyStockThreshold = safetyStockThreshold;
        this.resolved = resolved;
        this.read = read;
        this.createdAt = createdAt;
        this.resolvedAt = resolvedAt;
        this.readAt = readAt;
    }
} 