package com.inventory.controller;

import com.inventory.dto.PurchaseOrderResponse;
import com.inventory.service.PurchaseOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/purchase-orders/stats")
@PreAuthorize("hasRole('OWNER')")
public class PurchaseOrderStatsController {

    @Autowired
    private PurchaseOrderService purchaseOrderService;

    @GetMapping
    public ResponseEntity<List<PurchaseOrderResponse>> getAllPurchaseOrdersWithStats() {
        List<PurchaseOrderResponse> allPOs = purchaseOrderService.getAllPurchaseOrders();
        return ResponseEntity.ok(allPOs);
    }

    @GetMapping("/item/{itemId}")
    public ResponseEntity<List<PurchaseOrderResponse>> getPurchaseOrdersByItem(@PathVariable Long itemId) {
        List<PurchaseOrderResponse> pos = purchaseOrderService.getPurchaseOrdersByItem(itemId);
        return ResponseEntity.ok(pos);
    }

    @GetMapping("/pending")
    public ResponseEntity<List<PurchaseOrderResponse>> getPendingPurchaseOrders() {
        List<PurchaseOrderResponse> pendingPOs = purchaseOrderService.getPendingPurchaseOrders();
        return ResponseEntity.ok(pendingPOs);
    }

    @GetMapping("/arrived")
    public ResponseEntity<List<PurchaseOrderResponse>> getArrivedPurchaseOrders() {
        List<PurchaseOrderResponse> arrivedPOs = purchaseOrderService.getArrivedPurchaseOrders();
        return ResponseEntity.ok(arrivedPOs);
    }
} 