package com.inventory.dto;

import lombok.Data;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
public class UsageResponse {
    private Long id;
    private ItemSummary item;
    private String userName;
    private String department;
    
    @JsonProperty("dNumber")
    private String dNumber;
    
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

    public UsageResponse(Long id, ItemSummary item, String userName, String department, String dNumber, Integer quantityUsed, 
                        LocalDateTime usedAt, String notes, String barcode) {
        this.id = id;
        this.item = item;
        this.userName = userName;
        this.department = department;
        this.dNumber = dNumber;
        this.quantityUsed = quantityUsed;
        this.usedAt = usedAt;
        this.notes = notes;
        this.barcode = barcode;
    }
} 