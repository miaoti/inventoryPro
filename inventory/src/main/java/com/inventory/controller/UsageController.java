package com.inventory.controller;

import com.inventory.dto.UsageRequest;
import com.inventory.dto.UsageResponse;
import com.inventory.entity.Usage;
import com.inventory.entity.User;
import com.inventory.service.UsageService;
import com.inventory.service.UserService;
import com.inventory.service.ExcelExportService;
import com.inventory.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/usage")
public class UsageController {

    private static final Logger logger = LoggerFactory.getLogger(UsageController.class);

    @Autowired
    private UsageService usageService;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ExcelExportService excelExportService;

    /**
     * Extract username from JWT token in request
     */
    private String getCurrentUsername(HttpServletRequest request) {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                return jwtUtil.extractUsername(token);
            }
        } catch (Exception e) {
            logger.error("Error extracting username from token", e);
        }
        return null;
    }

    /**
     * Get department filter based on user role
     * - OWNER: can specify any department or see all (null)
     * - ADMIN/USER: can only see their own department
     */
    private String getDepartmentFilter(User user, String requestedDepartment) {
        if (user.getRole() == User.UserRole.OWNER) {
            // OWNER can filter by any department or see all
            return requestedDepartment;
        } else {
            // ADMIN/USER can only see their own department
            return user.getDepartment();
        }
    }

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
    public ResponseEntity<List<UsageResponse>> getAllUsage(HttpServletRequest request) {
        try {
            // Get current user from JWT token
            String username = getCurrentUsername(request);
            if (username == null) {
                logger.warn("Authentication failed for getAllUsage");
                return ResponseEntity.status(401).build();
            }
            
            User user = userService.findByUsername(username);
            if (user == null) {
                logger.warn("User not found: {}", username);
                return ResponseEntity.status(404).build();
            }
            
            // Get department filter based on user role
            String departmentFilter = getDepartmentFilter(user, null); // No specific department requested
            
            List<Usage> usageRecords;
            if (departmentFilter != null) {
                // Filter by department (for ADMIN/USER or OWNER with department filter)
                usageRecords = usageService.getUsageByDepartment(departmentFilter);
                logger.info("Retrieved usage records for department: {} by user: {}", departmentFilter, username);
            } else {
                // Show all (only for OWNER)
                usageRecords = usageService.getAllUsage();
                logger.info("Retrieved all usage records by OWNER user: {}", username);
            }
            
            List<UsageResponse> response = usageRecords.stream()
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());
                    
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error getting usage records", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/paginated")
    public ResponseEntity<Page<UsageResponse>> getAllUsagePaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest request) {
        try {
            // Get current user from JWT token
            String username = getCurrentUsername(request);
            if (username == null) {
                logger.warn("Authentication failed for getAllUsagePaginated");
                return ResponseEntity.status(401).build();
            }
            
            User user = userService.findByUsername(username);
            if (user == null) {
                logger.warn("User not found: {}", username);
                return ResponseEntity.status(404).build();
            }
            
            // For paginated results, we'll need to implement department filtering in the service layer
            // For now, return 401 for non-OWNER users as this endpoint doesn't support department filtering yet
            if (user.getRole() != User.UserRole.OWNER) {
                logger.warn("Paginated usage access denied for non-OWNER user: {}", username);
                return ResponseEntity.status(403).build();
            }
            
            Pageable pageable = PageRequest.of(page, size);
            Page<UsageResponse> response = usageService.getAllUsagePaginated(pageable)
                    .map(this::convertToResponse);
                    
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error getting paginated usage records", e);
            return ResponseEntity.internalServerError().build();
        }
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
    public ResponseEntity<List<UsageResponse>> getFilteredUsage(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String userName,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String barcodeOrItemCode,
            HttpServletRequest request) {
        
        try {
            // Get current user from JWT token
            String currentUsername = getCurrentUsername(request);
            if (currentUsername == null) {
                logger.warn("Authentication failed for getFilteredUsage");
                return ResponseEntity.status(401).build();
            }
            
            User user = userService.findByUsername(currentUsername);
            if (user == null) {
                logger.warn("User not found: {}", currentUsername);
                return ResponseEntity.status(404).build();
            }
            
            // Apply role-based department filtering
            String effectiveDepartment = getDepartmentFilter(user, department);
            
            logger.info("User {} (role: {}) filtering usage with department: {} (requested: {})", 
                    currentUsername, user.getRole(), effectiveDepartment, department);
            
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
            
            List<Usage> usageRecords = usageService.getUsageWithFilters(start, end, userName, effectiveDepartment, barcodeOrItemCode);
            
            List<UsageResponse> response = usageRecords.stream()
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());
                    
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error getting filtered usage records", e);
            return ResponseEntity.internalServerError().build();
        }
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
    public ResponseEntity<byte[]> exportUsageToExcel(HttpServletRequest request) {
        try {
            // Get current user from JWT token
            String username = getCurrentUsername(request);
            if (username == null) {
                logger.warn("Authentication failed for exportUsageToExcel");
                return ResponseEntity.status(401).build();
            }
            
            User user = userService.findByUsername(username);
            if (user == null) {
                logger.warn("User not found: {}", username);
                return ResponseEntity.status(404).build();
            }
            
            // Get department filter based on user role
            String departmentFilter = getDepartmentFilter(user, null);
            
            List<Usage> usageRecords;
            String filename;
            
            if (departmentFilter != null) {
                // Filter by department (for ADMIN/USER or OWNER with department filter)
                usageRecords = usageService.getUsageByDepartment(departmentFilter);
                filename = "usage_report_" + departmentFilter.replaceAll("[^a-zA-Z0-9]", "_") + ".xlsx";
                logger.info("Exporting usage records for department: {} by user: {}", departmentFilter, username);
            } else {
                // Show all (only for OWNER)
                usageRecords = usageService.getAllUsage();
                filename = "usage_report_all_departments.xlsx";
                logger.info("Exporting all usage records by OWNER user: {}", username);
            }
            
            byte[] excelData = excelExportService.exportUsageToExcel(usageRecords);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(excelData.length);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelData);
        } catch (Exception e) {
            logger.error("Error exporting usage data", e);
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
            @RequestParam(required = false) String barcodeOrItemCode,
            HttpServletRequest request) {
        try {
            // Get current user from JWT token
            String currentUsername = getCurrentUsername(request);
            if (currentUsername == null) {
                logger.warn("Authentication failed for exportFilteredUsageToExcel");
                return ResponseEntity.status(401).build();
            }
            
            User user = userService.findByUsername(currentUsername);
            if (user == null) {
                logger.warn("User not found: {}", currentUsername);
                return ResponseEntity.status(404).build();
            }
            
            // Apply role-based department filtering
            String effectiveDepartment = getDepartmentFilter(user, department);
            
            logger.info("User {} (role: {}) exporting filtered usage with department: {} (requested: {})", 
                    currentUsername, user.getRole(), effectiveDepartment, department);
            
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
            
            List<Usage> usageRecords = usageService.getUsageWithFilters(start, end, userName, effectiveDepartment, barcodeOrItemCode);
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
            usage.getDNumber(),
            usage.getQuantityUsed(),
            usage.getUsedAt(),
            usage.getNotes(),
            usage.getBarcode()
        );
    }
} 