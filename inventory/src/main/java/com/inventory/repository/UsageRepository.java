package com.inventory.repository;

import com.inventory.entity.Usage;
import com.inventory.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UsageRepository extends JpaRepository<Usage, Long> {
    
    // Find all usage records for a specific item
    List<Usage> findByItemOrderByUsedAtDesc(Item item);
    
    // Find all usage records by a specific user
    List<Usage> findByUserNameOrderByUsedAtDesc(String userName);
    
    // Find usage records within a date range
    List<Usage> findByUsedAtBetweenOrderByUsedAtDesc(LocalDateTime startDate, LocalDateTime endDate);
    
    // Find usage records by item and user
    List<Usage> findByItemAndUserNameOrderByUsedAtDesc(Item item, String userName);
    
    // Get paginated usage records
    Page<Usage> findAllByOrderByUsedAtDesc(Pageable pageable);
    
    // Get usage summary by item
    @Query("SELECT u.item.name, u.item.code, SUM(u.quantityUsed), COUNT(u) " +
           "FROM Usage u GROUP BY u.item.id, u.item.name, u.item.code " +
           "ORDER BY SUM(u.quantityUsed) DESC")
    List<Object[]> getUsageSummaryByItem();
    
    // Get usage summary by user
    @Query("SELECT u.userName, COUNT(u), SUM(u.quantityUsed) " +
           "FROM Usage u GROUP BY u.userName " +
           "ORDER BY SUM(u.quantityUsed) DESC")
    List<Object[]> getUsageSummaryByUser();

    // Find usage records by department
    List<Usage> findByDepartmentOrderByUsedAtDesc(String department);

    // Find usage records by barcode or item code
    @Query("SELECT u FROM Usage u WHERE u.barcode = :searchTerm OR UPPER(u.item.code) = :searchTerm ORDER BY u.usedAt DESC")
    List<Usage> findByBarcodeOrItemCodeOrderByUsedAtDesc(@Param("searchTerm") String searchTerm);

    // Advanced filtering with multiple criteria
    @Query("SELECT u FROM Usage u WHERE " +
           "(:startDate IS NULL OR u.usedAt >= :startDate) AND " +
           "(:endDate IS NULL OR u.usedAt <= :endDate) AND " +
           "(:userName IS NULL OR :userName = '' OR LOWER(u.userName) LIKE LOWER(CONCAT('%', :userName, '%'))) AND " +
           "(:department IS NULL OR :department = '' OR LOWER(u.department) LIKE LOWER(CONCAT('%', :department, '%'))) AND " +
           "(:barcodeOrItemCode IS NULL OR :barcodeOrItemCode = '' OR " +
           " u.barcode = :barcodeOrItemCode OR UPPER(u.item.code) = UPPER(:barcodeOrItemCode) OR " +
           " LOWER(u.item.name) LIKE LOWER(CONCAT('%', :barcodeOrItemCode, '%'))) " +
           "ORDER BY u.usedAt DESC")
    List<Usage> findUsageWithFilters(@Param("startDate") LocalDateTime startDate,
                                   @Param("endDate") LocalDateTime endDate,
                                   @Param("userName") String userName,
                                   @Param("department") String department,
                                   @Param("barcodeOrItemCode") String barcodeOrItemCode);
} 