package com.inventory.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UsageResponse {
    private Long id;
    private ItemSummary item;
    private String userName;
    private String department;
    private Integer quantityUsed;
    private LocalDateTime usedAt;
    private String notes;
    private String barcode;

    @Data
    public static class ItemSummary {
        private Long id;
        private String name;
        private String code;
        private String barcode;
        private String location;
    }

    public UsageResponse(Long id, ItemSummary item, String userName, String department, Integer quantityUsed, 
                        LocalDateTime usedAt, String notes, String barcode) {
        this.id = id;
        this.item = item;
        this.userName = userName;
        this.department = department;
        this.quantityUsed = quantityUsed;
        this.usedAt = usedAt;
        this.notes = notes;
        this.barcode = barcode;
    }
} 