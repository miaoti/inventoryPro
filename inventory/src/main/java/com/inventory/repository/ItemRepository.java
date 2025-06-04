package com.inventory.repository;

import com.inventory.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ItemRepository extends JpaRepository<Item, Long> {
    Optional<Item> findByBarcode(String barcode);
    Optional<Item> findByCode(String code);
    
    // Statistics Queries for Quick Stats Dashboard
    
    // Get items that are at or below 110% of safety stock (low stock warning threshold)
    @Query("SELECT i FROM Item i WHERE i.currentInventory <= (i.safetyStockThreshold * 1.1) AND i.currentInventory > i.safetyStockThreshold AND i.safetyStockThreshold > 0")
    List<Item> findLowStockItems();
    
    // Get items with critical or warning stock levels for alerts
    // Critical: <= 50% of safety stock, Warning: < 100% but > 50% of safety stock
    @Query("SELECT i FROM Item i WHERE i.currentInventory < i.safetyStockThreshold AND i.safetyStockThreshold > 0 ORDER BY (i.currentInventory * 1.0 / i.safetyStockThreshold)")
    List<Item> findStockAlertItems();
    
    // Get items below safety stock threshold
    @Query("SELECT i FROM Item i WHERE i.currentInventory < i.safetyStockThreshold AND i.safetyStockThreshold > 0")
    List<Item> findBelowSafetyStock();
    
    // Get items at critical stock levels (50% or less of safety stock)
    @Query("SELECT i FROM Item i WHERE i.currentInventory <= (i.safetyStockThreshold * 0.5) AND i.safetyStockThreshold > 0")
    List<Item> findCriticalStockItems();
    
    // Get general inventory statistics
    @Query("SELECT COUNT(i), SUM(i.currentInventory), AVG(i.currentInventory), " +
           "SUM(CASE WHEN i.currentInventory < i.safetyStockThreshold THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN i.currentInventory <= (i.safetyStockThreshold * 0.5) THEN 1 ELSE 0 END) " +
           "FROM Item i WHERE i.safetyStockThreshold > 0")
    Object[] getInventoryStatistics();
} 