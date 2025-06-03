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
@Table(name = "item_usage")
public class Usage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @Column(nullable = false)
    private String userName;

    @Column(nullable = false)
    private Integer quantityUsed;

    @Column(nullable = false)
    private LocalDateTime usedAt;

    @Column(length = 500)
    private String notes;

    @Column(nullable = false)
    private String barcode;

    @Column(length = 50)
    private String department;

    @PrePersist
    protected void onCreate() {
        usedAt = LocalDateTime.now();
    }

    public Usage(Item item, String userName, Integer quantityUsed, String notes, String barcode) {
        this.item = item;
        this.userName = userName;
        this.quantityUsed = quantityUsed;
        this.notes = notes;
        this.barcode = barcode;
    }

    public Usage(Item item, String userName, Integer quantityUsed, String notes, String barcode, String department) {
        this.item = item;
        this.userName = userName;
        this.quantityUsed = quantityUsed;
        this.notes = notes;
        this.barcode = barcode;
        this.department = department;
    }
} 