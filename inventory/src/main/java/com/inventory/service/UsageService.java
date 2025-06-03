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
        item.setCurrentInventory(item.getCurrentInventory() - request.getQuantityUsed());
        item.setUsedInventory(item.getUsedInventory() + request.getQuantityUsed());
        itemRepository.save(item);

        // Create usage record
        Usage usage = new Usage(
            item,
            request.getUserName(),
            request.getQuantityUsed(),
            request.getNotes(),
            request.getBarcode(),
            request.getDepartment()
        );

        Usage savedUsage = usageRepository.save(usage);

        // Check for alerts after usage
        alertService.checkAndCreateSafetyStockAlert(item);

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