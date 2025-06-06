package com.inventory.repository;

import com.inventory.entity.PurchaseOrder;
import com.inventory.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
    
    List<PurchaseOrder> findByItemAndArrivedFalse(Item item);
    
    List<PurchaseOrder> findByItem(Item item);
    
    List<PurchaseOrder> findByArrivedFalse();
    
    List<PurchaseOrder> findByArrivedTrue();
    
    @Query("SELECT SUM(po.quantity) FROM PurchaseOrder po WHERE po.item = :item AND po.arrived = false")
    Integer getTotalPendingQuantityForItem(@Param("item") Item item);
} 