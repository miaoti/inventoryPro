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
} 