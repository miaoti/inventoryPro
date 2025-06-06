package com.inventory.controller;

import com.inventory.dto.PurchaseOrderRequest;
import com.inventory.dto.PurchaseOrderResponse;
import com.inventory.service.PurchaseOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/items")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class PurchaseOrderController {

    @Autowired
    private PurchaseOrderService purchaseOrderService;

    @GetMapping("/{itemId}/purchase-orders")
    public ResponseEntity<List<PurchaseOrderResponse>> getPurchaseOrdersByItem(@PathVariable Long itemId) {
        List<PurchaseOrderResponse> purchaseOrders = purchaseOrderService.getPurchaseOrdersByItem(itemId);
        return ResponseEntity.ok(purchaseOrders);
    }

    @GetMapping("/{itemId}/purchase-orders/pending")
    public ResponseEntity<List<PurchaseOrderResponse>> getPendingPurchaseOrdersByItem(@PathVariable Long itemId) {
        List<PurchaseOrderResponse> pendingPOs = purchaseOrderService.getPendingPurchaseOrdersByItem(itemId);
        return ResponseEntity.ok(pendingPOs);
    }

    @PostMapping("/{itemId}/purchase-orders")
    public ResponseEntity<PurchaseOrderResponse> createPurchaseOrder(@PathVariable Long itemId, @RequestBody PurchaseOrderRequest request, Authentication authentication) {
        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            return ResponseEntity.badRequest().build();
        }
        
        // Set the itemId from path parameter
        request.setItemId(itemId);
        
        try {
            String username = authentication != null ? authentication.getName() : null;
            PurchaseOrderResponse response = purchaseOrderService.createPurchaseOrder(request, username);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{itemId}/purchase-orders/{id}")
    public ResponseEntity<PurchaseOrderResponse> updatePurchaseOrder(@PathVariable Long itemId, @PathVariable Long id, @RequestBody PurchaseOrderRequest request, Authentication authentication) {
        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            return ResponseEntity.badRequest().build();
        }
        
        try {
            String username = authentication != null ? authentication.getName() : null;
            PurchaseOrderResponse response = purchaseOrderService.updatePurchaseOrder(id, request, username);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/purchase-orders/{id}/arrive")
    public ResponseEntity<PurchaseOrderResponse> markAsArrived(@PathVariable Long id, Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : null;
            PurchaseOrderResponse response = purchaseOrderService.markAsArrived(id, username);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{itemId}/purchase-orders/pending-quantity")
    public ResponseEntity<Integer> getTotalPendingQuantity(@PathVariable Long itemId) {
        Integer total = purchaseOrderService.getTotalPendingQuantityForItem(itemId);
        return ResponseEntity.ok(total);
    }
} 