package com.inventory.service;

import com.inventory.entity.Usage;
import com.inventory.entity.Item;
import com.inventory.repository.UsageRepository;
import com.inventory.repository.ItemRepository;
import com.inventory.dto.UsageRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UsageService {

    @Autowired
    private UsageRepository usageRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private AlertService alertService;

    @Transactional
    public Usage recordUsage(UsageRequest request) {
        // Validate request
        if (request == null) {
            throw new RuntimeException("Usage request cannot be null");
        }
        if (request.getBarcode() == null || request.getBarcode().trim().isEmpty()) {
            throw new RuntimeException("Barcode is required");
        }
        if (request.getUserName() == null || request.getUserName().trim().isEmpty()) {
            throw new RuntimeException("User name is required");
        }
        if (request.getQuantityUsed() == null || request.getQuantityUsed() <= 0) {
            throw new RuntimeException("Quantity used must be greater than 0");
        }
        if (request.getDepartment() == null || request.getDepartment().trim().isEmpty()) {
            throw new RuntimeException("Department is required");
        }

        // Find the item by barcode
        Optional<Item> itemOpt = itemRepository.findByBarcode(request.getBarcode());
        if (itemOpt.isEmpty()) {
            // Try to find by item code if not found by barcode
            itemOpt = itemRepository.findByCode(request.getBarcode().toUpperCase());
        }
        
        if (itemOpt.isEmpty()) {
            throw new RuntimeException("Item not found with barcode: " + request.getBarcode());
        }

        Item item = itemOpt.get();

        // Check if there's enough inventory
        if (item.getCurrentInventory() < request.getQuantityUsed()) {
            throw new RuntimeException("Insufficient inventory. Available: " + item.getCurrentInventory() + 
                                     ", Requested: " + request.getQuantityUsed());
        }

        // Update item inventory - reduce current inventory and track used inventory
        int oldInventory = item.getCurrentInventory();
        item.setCurrentInventory(item.getCurrentInventory() - request.getQuantityUsed());
        item.setUsedInventory(item.getUsedInventory() + request.getQuantityUsed());
        Item savedItem = itemRepository.save(item);

        System.out.println("=== USAGE DEBUG ===");
        System.out.println("Item: " + savedItem.getName() + " (" + savedItem.getCode() + ")");
        System.out.println("Old Inventory: " + oldInventory);
        System.out.println("New Current Inventory: " + savedItem.getCurrentInventory());
        System.out.println("Safety Stock Threshold: " + savedItem.getSafetyStockThreshold());
        System.out.println("Pending PO: " + savedItem.getPendingPO());
        System.out.println("Should trigger alert? " + (savedItem.getCurrentInventory() <= savedItem.getSafetyStockThreshold()));
        System.out.println("==================");

        // Create usage record with proper null handling
        // Note: We store the user's department for audit purposes, but filter by item's department
        Usage usage = new Usage(
            savedItem,  // Use saved item to ensure we have the latest state
            request.getUserName().trim(),
            request.getQuantityUsed(),
            request.getNotes() != null ? request.getNotes().trim() : null,
            request.getBarcode().trim(),
            request.getDepartment().trim(), // Store user's department for audit trail
            request.getDNumber() != null ? request.getDNumber().trim() : null
        );

        Usage savedUsage = usageRepository.save(usage);

        // Check for alerts after usage (use saved item to ensure latest state)
        alertService.checkAndCreateSafetyStockAlert(savedItem);

        return savedUsage;
    }

    public List<Usage> getAllUsage() {
        return usageRepository.findAll();
    }

    public Page<Usage> getAllUsagePaginated(Pageable pageable) {
        return usageRepository.findAllByOrderByUsedAtDesc(pageable);
    }

    public List<Usage> getUsageByItem(Long itemId) {
        Optional<Item> item = itemRepository.findById(itemId);
        if (item.isPresent()) {
            return usageRepository.findByItemOrderByUsedAtDesc(item.get());
        }
        return List.of();
    }

    public List<Usage> getUsageByUser(String userName) {
        return usageRepository.findByUserNameOrderByUsedAtDesc(userName);
    }

    public List<Usage> getUsageInDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return usageRepository.findByUsedAtBetweenOrderByUsedAtDesc(startDate, endDate);
    }

    public List<Object[]> getUsageSummaryByItem() {
        return usageRepository.getUsageSummaryByItem();
    }

    public List<Object[]> getUsageSummaryByUser() {
        return usageRepository.getUsageSummaryByUser();
    }

    public List<Usage> getUsageByDepartment(String department) {
        return usageRepository.findByDepartmentOrderByUsedAtDesc(department);
    }

    public List<Usage> getUsageByBarcodeOrItemCode(String searchTerm) {
        // Search by barcode or item code
        return usageRepository.findByBarcodeOrItemCodeOrderByUsedAtDesc(searchTerm.toUpperCase());
    }

    public List<Usage> getUsageWithFilters(LocalDateTime startDate, LocalDateTime endDate, 
                                          String userName, String department, String barcodeOrItemCode) {
        return usageRepository.findUsageWithFilters(startDate, endDate, userName, department, barcodeOrItemCode);
    }
} 