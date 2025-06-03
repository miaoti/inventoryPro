package com.inventory.controller;

import com.inventory.dto.UsageRequest;
import com.inventory.dto.UsageResponse;
import com.inventory.entity.Usage;
import com.inventory.service.UsageService;
import com.inventory.service.ExcelExportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/usage")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class UsageController {

    @Autowired
    private UsageService usageService;

    @Autowired
    private ExcelExportService excelExportService;

    @PostMapping("/record")
    public ResponseEntity<?> recordUsage(@RequestBody UsageRequest request) {
        try {
            Usage usage = usageService.recordUsage(request);
            return ResponseEntity.ok(convertToResponse(usage));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public List<UsageResponse> getAllUsage() {
        return usageService.getAllUsage().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @GetMapping("/paginated")
    public Page<UsageResponse> getAllUsagePaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return usageService.getAllUsagePaginated(pageable)
                .map(this::convertToResponse);
    }

    @GetMapping("/item/{itemId}")
    public List<UsageResponse> getUsageByItem(@PathVariable Long itemId) {
        return usageService.getUsageByItem(itemId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @GetMapping("/user/{userName}")
    public List<UsageResponse> getUsageByUser(@PathVariable String userName) {
        return usageService.getUsageByUser(userName).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @GetMapping("/date-range")
    public List<UsageResponse> getUsageInDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
        LocalDateTime start = LocalDateTime.parse(startDate + "T00:00:00", formatter);
        LocalDateTime end = LocalDateTime.parse(endDate + "T23:59:59", formatter);
        
        return usageService.getUsageInDateRange(start, end).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @GetMapping("/department/{department}")
    public List<UsageResponse> getUsageByDepartment(@PathVariable String department) {
        return usageService.getUsageByDepartment(department).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @GetMapping("/barcode-or-item/{searchTerm}")
    public List<UsageResponse> getUsageByBarcodeOrItem(@PathVariable String searchTerm) {
        return usageService.getUsageByBarcodeOrItemCode(searchTerm).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @GetMapping("/filtered")
    public List<UsageResponse> getFilteredUsage(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String userName,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String barcodeOrItemCode) {
        
        LocalDateTime start = null;
        LocalDateTime end = null;
        
        if (startDate != null && !startDate.isEmpty()) {
            DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
            start = LocalDateTime.parse(startDate + "T00:00:00", formatter);
        }
        
        if (endDate != null && !endDate.isEmpty()) {
            DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
            end = LocalDateTime.parse(endDate + "T23:59:59", formatter);
        }
        
        return usageService.getUsageWithFilters(start, end, userName, department, barcodeOrItemCode).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @GetMapping("/summary/items")
    public List<Map<String, Object>> getUsageSummaryByItem() {
        return usageService.getUsageSummaryByItem().stream()
                .map(row -> Map.of(
                    "itemName", row[0],
                    "itemCode", row[1],
                    "totalQuantityUsed", row[2],
                    "usageCount", row[3]
                ))
                .collect(Collectors.toList());
    }

    @GetMapping("/summary/users")
    public List<Map<String, Object>> getUsageSummaryByUser() {
        return usageService.getUsageSummaryByUser().stream()
                .map(row -> Map.of(
                    "userName", row[0],
                    "usageCount", row[1],
                    "totalQuantityUsed", row[2]
                ))
                .collect(Collectors.toList());
    }

    @GetMapping("/export/excel")
    public ResponseEntity<byte[]> exportUsageToExcel() {
        try {
            List<Usage> usageRecords = usageService.getAllUsage();
            byte[] excelData = excelExportService.exportUsageToExcel(usageRecords);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", "usage_report.xlsx");
            headers.setContentLength(excelData.length);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelData);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/export/excel/date-range")
    public ResponseEntity<byte[]> exportUsageToExcelByDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        try {
            DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
            LocalDateTime start = LocalDateTime.parse(startDate + "T00:00:00", formatter);
            LocalDateTime end = LocalDateTime.parse(endDate + "T23:59:59", formatter);
            
            List<Usage> usageRecords = usageService.getUsageInDateRange(start, end);
            byte[] excelData = excelExportService.exportUsageToExcel(usageRecords);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", "usage_report_" + startDate + "_to_" + endDate + ".xlsx");
            headers.setContentLength(excelData.length);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelData);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/export/excel/filtered")
    public ResponseEntity<byte[]> exportFilteredUsageToExcel(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String userName,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String barcodeOrItemCode) {
        try {
            LocalDateTime start = null;
            LocalDateTime end = null;
            
            if (startDate != null && !startDate.isEmpty()) {
                DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
                start = LocalDateTime.parse(startDate + "T00:00:00", formatter);
            }
            
            if (endDate != null && !endDate.isEmpty()) {
                DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
                end = LocalDateTime.parse(endDate + "T23:59:59", formatter);
            }
            
            List<Usage> usageRecords = usageService.getUsageWithFilters(start, end, userName, department, barcodeOrItemCode);
            byte[] excelData = excelExportService.exportUsageToExcel(usageRecords);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            
            // Create a more descriptive filename based on applied filters
            StringBuilder filename = new StringBuilder("filtered_usage_report");
            if (startDate != null && !startDate.isEmpty() && endDate != null && !endDate.isEmpty()) {
                filename.append("_").append(startDate).append("_to_").append(endDate);
            }
            if (userName != null && !userName.isEmpty()) {
                filename.append("_user_").append(userName.replaceAll("[^a-zA-Z0-9]", "_"));
            }
            if (department != null && !department.isEmpty()) {
                filename.append("_dept_").append(department.replaceAll("[^a-zA-Z0-9]", "_"));
            }
            if (barcodeOrItemCode != null && !barcodeOrItemCode.isEmpty()) {
                filename.append("_item_").append(barcodeOrItemCode.replaceAll("[^a-zA-Z0-9]", "_"));
            }
            filename.append(".xlsx");
            
            headers.setContentDispositionFormData("attachment", filename.toString());
            headers.setContentLength(excelData.length);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelData);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    private UsageResponse convertToResponse(Usage usage) {
        UsageResponse.ItemSummary itemSummary = new UsageResponse.ItemSummary();
        itemSummary.setId(usage.getItem().getId());
        itemSummary.setName(usage.getItem().getName());
        itemSummary.setCode(usage.getItem().getCode());
        itemSummary.setBarcode(usage.getItem().getBarcode());
        itemSummary.setLocation(usage.getItem().getLocation());

        return new UsageResponse(
            usage.getId(),
            itemSummary,
            usage.getUserName(),
            usage.getDepartment(),
            usage.getQuantityUsed(),
            usage.getUsedAt(),
            usage.getNotes(),
            usage.getBarcode()
        );
    }
} 