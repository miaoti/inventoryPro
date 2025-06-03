package com.inventory.repository;

import com.inventory.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ItemRepository extends JpaRepository<Item, Long> {
    Optional<Item> findByBarcode(String barcode);
    Optional<Item> findByCode(String code);
} 