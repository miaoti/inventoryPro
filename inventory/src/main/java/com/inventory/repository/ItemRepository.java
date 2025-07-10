package com.inventory.repository;

import com.inventory.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ItemRepository extends JpaRepository<Item, Long> {
    Optional<Item> findByBarcode(String barcode);
    Optional<Item> findByCode(String code);
    Optional<Item> findByQrCodeId(String qrCodeId);
    
    // Statistics Queries for Quick Stats Dashboard
    
    // Get items that are at or below 110% of safety stock (low stock warning threshold)
    @Query("SELECT i FROM Item i WHERE i.currentInventory <= CEILING(i.safetyStockThreshold * 1.1) AND i.currentInventory > i.safetyStockThreshold AND i.safetyStockThreshold > 0")
    List<Item> findLowStockItems();
    
    // Get items with configurable warning/critical stock levels for alerts
    @Query("SELECT i FROM Item i WHERE i.currentInventory <= (i.safetyStockThreshold * :warningThresholdPercent / 100.0) AND i.safetyStockThreshold > 0 ORDER BY (i.currentInventory * 1.0 / i.safetyStockThreshold)")
    List<Item> findStockAlertItems(@Param("warningThresholdPercent") int warningThresholdPercent);
    
    // Get items below configurable warning threshold
    @Query("SELECT i FROM Item i WHERE i.currentInventory <= (i.safetyStockThreshold * :warningThresholdPercent / 100.0) AND i.safetyStockThreshold > 0")
    List<Item> findBelowWarningThreshold(@Param("warningThresholdPercent") int warningThresholdPercent);
    
    // Get items at critical stock levels using configurable threshold
    @Query("SELECT i FROM Item i WHERE i.currentInventory <= (i.safetyStockThreshold * :criticalThresholdPercent / 100.0) AND i.safetyStockThreshold > 0")
    List<Item> findCriticalStockItems(@Param("criticalThresholdPercent") int criticalThresholdPercent);
    
    // Get general inventory statistics using configurable thresholds
    @Query("SELECT COUNT(i), SUM(i.currentInventory), AVG(i.currentInventory), " +
           "SUM(CASE WHEN i.currentInventory <= (i.safetyStockThreshold * :warningThresholdPercent / 100.0) THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN i.currentInventory <= (i.safetyStockThreshold * :criticalThresholdPercent / 100.0) THEN 1 ELSE 0 END) " +
           "FROM Item i WHERE i.safetyStockThreshold > 0")
    Object[] getInventoryStatistics(@Param("warningThresholdPercent") int warningThresholdPercent, 
                                   @Param("criticalThresholdPercent") int criticalThresholdPercent);
    
    // Legacy methods for backward compatibility (can be removed later)
    @Deprecated
    @Query("SELECT i FROM Item i WHERE i.currentInventory < i.safetyStockThreshold AND i.safetyStockThreshold > 0")
    List<Item> findBelowSafetyStock();
    
    @Deprecated
    @Query("SELECT i FROM Item i WHERE i.currentInventory <= (i.safetyStockThreshold * 0.5) AND i.safetyStockThreshold > 0")
    List<Item> findLegacyCriticalStockItems();
    
    // Department-based access control queries
    
    // Find items accessible by a specific department (department items + public items)
    @Query("SELECT i FROM Item i WHERE i.department IS NULL OR i.department = '' OR i.department = :department")
    List<Item> findByDepartmentOrPublic(@Param("department") String department);
    
    // Find all items by department (for owner filtering)
    @Query("SELECT i FROM Item i WHERE i.department = :department")
    List<Item> findByDepartment(@Param("department") String department);
    
    // Find only public items (department is null or empty)
    @Query("SELECT i FROM Item i WHERE i.department IS NULL OR i.department = ''")
    List<Item> findPublicItems();
    
    // Get distinct departments from items (for filter dropdown)
    @Query("SELECT DISTINCT i.department FROM Item i WHERE i.department IS NOT NULL AND i.department != '' ORDER BY i.department")
    List<String> findDistinctDepartments();
    
    // Department-aware low stock items
    @Query("SELECT i FROM Item i WHERE (i.department IS NULL OR i.department = '' OR i.department = :department) " +
           "AND i.currentInventory <= CEILING(i.safetyStockThreshold * 1.1) AND i.currentInventory > i.safetyStockThreshold AND i.safetyStockThreshold > 0")
    List<Item> findLowStockItemsByDepartment(@Param("department") String department);
    
    // Department-aware critical stock items
    @Query("SELECT i FROM Item i WHERE (i.department IS NULL OR i.department = '' OR i.department = :department) " +
           "AND i.currentInventory <= (i.safetyStockThreshold * :criticalThresholdPercent / 100.0) AND i.safetyStockThreshold > 0")
    List<Item> findCriticalStockItemsByDepartment(@Param("department") String department, @Param("criticalThresholdPercent") int criticalThresholdPercent);
    
    // Department-aware inventory statistics
    @Query("SELECT COUNT(i), SUM(i.currentInventory), AVG(i.currentInventory), " +
           "SUM(CASE WHEN i.currentInventory <= (i.safetyStockThreshold * :warningThresholdPercent / 100.0) THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN i.currentInventory <= (i.safetyStockThreshold * :criticalThresholdPercent / 100.0) THEN 1 ELSE 0 END) " +
           "FROM Item i WHERE i.safetyStockThreshold > 0 AND " +
           "(:department IS NULL OR :department = '' OR i.department IS NULL OR i.department = '' OR i.department = :department)")
    Object[] getInventoryStatisticsByDepartment(@Param("department") String department,
                                               @Param("warningThresholdPercent") int warningThresholdPercent, 
                                               @Param("criticalThresholdPercent") int criticalThresholdPercent);
} 