package com.inventory.dto;

import lombok.Data;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
public class UsageRequest {
    private String barcode;
    private String userName;
    private Integer quantityUsed;
    private String notes;
    private String department;
    
    @JsonProperty("dNumber")
    private String dNumber;

    @Override
    public String toString() {
        return "UsageRequest{" +
                "barcode='" + barcode + '\'' +
                ", userName='" + userName + '\'' +
                ", quantityUsed=" + quantityUsed +
                ", notes='" + notes + '\'' +
                ", department='" + department + '\'' +
                ", dNumber='" + dNumber + '\'' +
                '}';
    }
} 