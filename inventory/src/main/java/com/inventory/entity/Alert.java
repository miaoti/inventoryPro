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
@Table(name = "alerts")
public class Alert {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @Column(nullable = false)
    private String alertType; // "SAFETY_STOCK", "LOW_INVENTORY", etc.

    @Column(nullable = false)
    private String message;

    @Column(nullable = false)
    private Integer currentInventory;

    @Column(nullable = false)
    private Integer pendingPO;

    @Column(nullable = false)
    private Integer usedInventory;

    @Column(nullable = false)
    private Integer safetyStockThreshold;

    @Column(nullable = false)
    private Boolean resolved = false;

    @Column(name = "`read`", nullable = false)
    private Boolean read = false;

    @Column(nullable = false)
    private Boolean ignored = false;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = true)
    private LocalDateTime resolvedAt;

    @Column(nullable = true)
    private LocalDateTime readAt;

    @Column(nullable = true)
    private LocalDateTime ignoredAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public void resolve() {
        this.resolved = true;
        this.resolvedAt = LocalDateTime.now();
    }

    public void markAsRead() {
        this.read = true;
        this.readAt = LocalDateTime.now();
    }

    public void ignore() {
        this.ignored = true;
        this.ignoredAt = LocalDateTime.now();
    }
} 