package com.inventory.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "items")
public class Item {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;
    
    @Column(length = 500)
    private String englishDescription;

    @Column(nullable = false)
    private Integer currentInventory = 0;

    @Column(nullable = false)
    private Integer pendingPO = 0;

    @Column(nullable = false)
    private Integer usedInventory = 0;

    @Column(nullable = false)
    private Integer safetyStockThreshold;

    @Column(nullable = true)
    private String barcode;

    @Column(nullable = true)
    private String location;
    
    @Column(nullable = true)
    private String equipment;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ABCCategory category = ABCCategory.C;

    @Column(nullable = true)
    private String status;

    @Column(nullable = true)
    private Integer estimatedConsumption;

    @Column(nullable = true)
    private String rack;

    @Column(nullable = true)
    private String floor;

    @Column(nullable = true)
    private String area;

    @Column(length = 20)
    private String bin;

    // Weekly data stored as JSON to allow for dynamic weeks
    @Column(columnDefinition = "TEXT")
    private String weeklyData; // JSON format: {"22": 100, "23": 95, "24": 80, ...}

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public boolean needsRestock() {
        return (currentInventory + pendingPO - usedInventory) < safetyStockThreshold;
    }

    public enum ABCCategory {
        A, B, C
    }
} 