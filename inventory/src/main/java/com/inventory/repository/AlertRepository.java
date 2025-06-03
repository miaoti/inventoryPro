package com.inventory.repository;

import com.inventory.entity.Alert;
import com.inventory.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {
    @Query("SELECT a FROM Alert a JOIN FETCH a.item WHERE a.resolved = false ORDER BY a.createdAt DESC")
    List<Alert> findByResolvedFalseOrderByCreatedAtDesc();
    
    @Query("SELECT a FROM Alert a JOIN FETCH a.item ORDER BY a.createdAt DESC")
    List<Alert> findAllByOrderByCreatedAtDesc();
    
    List<Alert> findByItemAndResolvedFalse(Item item);
    
    @Query("SELECT a FROM Alert a WHERE a.item = ?1 AND a.alertType = ?2 AND a.resolved = false")
    Optional<Alert> findActiveAlertByItemAndType(Item item, String alertType);
    
    long countByResolvedFalse();
    
    long countByResolvedFalseAndReadFalse();
    
    @Query("SELECT a FROM Alert a JOIN FETCH a.item WHERE a.resolved = false AND a.read = false ORDER BY a.createdAt DESC")
    List<Alert> findUnreadAlertsOrderByCreatedAtDesc();
} 