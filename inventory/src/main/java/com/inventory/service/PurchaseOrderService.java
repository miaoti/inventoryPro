package com.inventory.service;

import com.inventory.entity.Item;
import com.inventory.entity.PurchaseOrder;
import com.inventory.repository.ItemRepository;
import com.inventory.repository.PurchaseOrderRepository;
import com.inventory.dto.PurchaseOrderRequest;
import com.inventory.dto.PurchaseOrderResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PurchaseOrderService {

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private AlertService alertService;

    @Transactional(readOnly = true)
    public List<PurchaseOrderResponse> getPurchaseOrdersByItem(Long itemId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));
        
        List<PurchaseOrder> purchaseOrders = purchaseOrderRepository.findByItem(item);
        return purchaseOrders.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrderResponse> getPendingPurchaseOrdersByItem(Long itemId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));
        
        List<PurchaseOrder> pendingPOs = purchaseOrderRepository.findByItemAndArrivedFalse(item);
        return pendingPOs.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public PurchaseOrderResponse createPurchaseOrder(PurchaseOrderRequest request) {
        return createPurchaseOrder(request, null);
    }

    @Transactional
    public PurchaseOrderResponse createPurchaseOrder(PurchaseOrderRequest request, String createdBy) {
        Item item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new RuntimeException("Item not found"));

        PurchaseOrder purchaseOrder = new PurchaseOrder();
        purchaseOrder.setItem(item);
        purchaseOrder.setQuantity(request.getQuantity());
        purchaseOrder.setOrderDate(request.getOrderDate());
        purchaseOrder.setTrackingNumber(request.getTrackingNumber());
        purchaseOrder.setCreatedBy(createdBy);

        PurchaseOrder savedPO = purchaseOrderRepository.save(purchaseOrder);
        
        // Update item's pending PO count
        updateItemPendingPO(item);
        
        // Check for alerts
        alertService.checkAndCreateSafetyStockAlert(item);

        return convertToResponse(savedPO);
    }

    @Transactional
    public PurchaseOrderResponse markAsArrived(Long purchaseOrderId) {
        return markAsArrived(purchaseOrderId, null);
    }

    @Transactional
    public PurchaseOrderResponse markAsArrived(Long purchaseOrderId, String arrivedBy) {
        PurchaseOrder purchaseOrder = purchaseOrderRepository.findById(purchaseOrderId)
                .orElseThrow(() -> new RuntimeException("Purchase Order not found"));

        if (purchaseOrder.getArrived()) {
            throw new RuntimeException("Purchase Order already arrived");
        }

        // Mark as arrived
        purchaseOrder.markAsArrived(arrivedBy);
        PurchaseOrder savedPO = purchaseOrderRepository.save(purchaseOrder);

        // Add to current inventory
        Item item = purchaseOrder.getItem();
        item.setCurrentInventory(item.getCurrentInventory() + purchaseOrder.getQuantity());
        itemRepository.save(item);

        // Update item's pending PO count
        updateItemPendingPO(item);
        
        // Check for alerts
        alertService.checkAndCreateSafetyStockAlert(item);

        return convertToResponse(savedPO);
    }

    @Transactional
    public PurchaseOrderResponse updatePurchaseOrder(Long purchaseOrderId, PurchaseOrderRequest request, String updatedBy) {
        PurchaseOrder purchaseOrder = purchaseOrderRepository.findById(purchaseOrderId)
                .orElseThrow(() -> new RuntimeException("Purchase Order not found"));

        // Only allow editing if not yet arrived
        if (purchaseOrder.getArrived()) {
            throw new RuntimeException("Cannot edit arrived Purchase Order");
        }

        // Store old quantity for inventory adjustment
        int oldQuantity = purchaseOrder.getQuantity();

        // Update the purchase order
        purchaseOrder.setQuantity(request.getQuantity());
        if (request.getTrackingNumber() != null) {
            purchaseOrder.setTrackingNumber(request.getTrackingNumber());
        }
        if (request.getOrderDate() != null) {
            purchaseOrder.setOrderDate(request.getOrderDate());
        }

        PurchaseOrder savedPO = purchaseOrderRepository.save(purchaseOrder);

        // Update item's pending PO count if quantity changed
        if (oldQuantity != request.getQuantity()) {
            updateItemPendingPO(purchaseOrder.getItem());
        }
        
        // Check for alerts
        alertService.checkAndCreateSafetyStockAlert(purchaseOrder.getItem());

        return convertToResponse(savedPO);
    }

    @Transactional
    public void updateItemPendingPO(Item item) {
        Integer totalPending = purchaseOrderRepository.getTotalPendingQuantityForItem(item);
        if (totalPending == null) {
            totalPending = 0;
        }
        item.setPendingPO(totalPending);
        itemRepository.save(item);
    }

    public Integer getTotalPendingQuantityForItem(Long itemId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));
        
        Integer total = purchaseOrderRepository.getTotalPendingQuantityForItem(item);
        return total != null ? total : 0;
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrderResponse> getAllPurchaseOrders() {
        List<PurchaseOrder> allPOs = purchaseOrderRepository.findAll();
        return allPOs.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrderResponse> getPendingPurchaseOrders() {
        List<PurchaseOrder> pendingPOs = purchaseOrderRepository.findByArrivedFalse();
        return pendingPOs.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrderResponse> getArrivedPurchaseOrders() {
        List<PurchaseOrder> arrivedPOs = purchaseOrderRepository.findByArrivedTrue();
        return arrivedPOs.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    private PurchaseOrderResponse convertToResponse(PurchaseOrder purchaseOrder) {
        PurchaseOrderResponse response = new PurchaseOrderResponse();
        response.setId(purchaseOrder.getId());
        response.setItemId(purchaseOrder.getItem().getId());
        
        // Safely access the Item name by forcing lazy loading within transaction
        try {
            response.setItemName(purchaseOrder.getItem().getName());
        } catch (Exception e) {
            // Fallback in case of lazy loading issues
            response.setItemName("Unknown Item");
        }
        
        response.setQuantity(purchaseOrder.getQuantity());
        response.setOrderDate(purchaseOrder.getOrderDate());
        response.setArrivalDate(purchaseOrder.getArrivalDate());
        response.setTrackingNumber(purchaseOrder.getTrackingNumber());
        response.setArrived(purchaseOrder.getArrived());
        response.setCreatedBy(purchaseOrder.getCreatedBy());
        response.setArrivedBy(purchaseOrder.getArrivedBy());
        response.setCreatedAt(purchaseOrder.getCreatedAt());
        response.setUpdatedAt(purchaseOrder.getUpdatedAt());
        return response;
    }
} 