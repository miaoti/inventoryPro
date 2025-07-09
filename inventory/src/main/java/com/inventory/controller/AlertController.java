package com.inventory.controller;

import com.inventory.dto.AlertResponse;
import com.inventory.entity.Alert;
import com.inventory.entity.User;
import com.inventory.service.AlertService;
import com.inventory.service.ExcelExportService;
import com.inventory.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/alerts")
public class AlertController {

    @Autowired
    private AlertService alertService;

    @Autowired
    private ExcelExportService excelExportService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<AlertResponse> getAllAlerts() {
        return filterAlertsByDepartmentAccess(alertService.getAllAlerts()).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @GetMapping("/active")
    public List<AlertResponse> getActiveAlerts() {
        return filterAlertsByDepartmentAccess(alertService.getActiveAlerts()).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @GetMapping("/ignored")
    public List<AlertResponse> getIgnoredAlerts() {
        return filterAlertsByDepartmentAccess(alertService.getIgnoredAlerts()).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @GetMapping("/resolved")
    public List<AlertResponse> getResolvedAlerts() {
        return filterAlertsByDepartmentAccess(alertService.getResolvedAlerts()).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @GetMapping("/count")
    public Map<String, Long> getActiveAlertCount() {
        // Filter alerts for department access before counting
        List<Alert> filteredActiveAlerts = filterAlertsByDepartmentAccess(alertService.getActiveAlerts());
        List<Alert> filteredUnreadAlerts = filterAlertsByDepartmentAccess(alertService.getUnreadAlerts());
        
        return Map.of(
            "activeAlerts", (long) filteredActiveAlerts.size(),
            "unreadAlerts", (long) filteredUnreadAlerts.size()
        );
    }

    @GetMapping("/unread")
    public List<AlertResponse> getUnreadAlerts() {
        return filterAlertsByDepartmentAccess(alertService.getUnreadAlerts()).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Map<String, String>> markAlertAsRead(@PathVariable Long id) {
        alertService.markAlertAsRead(id);
        return ResponseEntity.ok(Map.of("message", "Alert marked as read"));
    }

    @PostMapping("/{id}/resolve")
    public ResponseEntity<Map<String, String>> resolveAlert(@PathVariable Long id) {
        alertService.resolveAlert(id);
        return ResponseEntity.ok(Map.of("message", "Alert resolved successfully"));
    }

    @GetMapping("/export/excel")
    public ResponseEntity<byte[]> exportAlertsToExcel() {
        try {
            List<Alert> alerts = filterAlertsByDepartmentAccess(alertService.getAllAlerts());
            byte[] excelData = excelExportService.exportAlertsToExcel(alerts);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", "alerts_report.xlsx");
            headers.setContentLength(excelData.length);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelData);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Filter alerts based on current user's department access
     * OWNER users see all alerts
     * ADMIN users see alerts for their department + public items only
     * USER users see alerts for public items only
     */
    private List<Alert> filterAlertsByDepartmentAccess(List<Alert> alerts) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            return alerts; // Return all if no authentication context (shouldn't happen)
        }

        User currentUser = userRepository.findByUsername(authentication.getName());
        if (currentUser == null) {
            return alerts; // Return all if user not found (shouldn't happen)
        }

        System.out.println("Filtering alerts for user: " + currentUser.getUsername() + " (Role: " + currentUser.getRole() + ", Dept: " + currentUser.getDepartment() + ")");

        // OWNER users see all alerts
        if (currentUser.getRole() == User.UserRole.OWNER) {
            System.out.println("OWNER user - returning all " + alerts.size() + " alerts");
            return alerts;
        }

        // Filter alerts based on department access
        List<Alert> filteredAlerts = alerts.stream()
                .filter(alert -> shouldUserSeeAlert(currentUser, alert))
                .collect(Collectors.toList());

        System.out.println("Filtered alerts: " + filteredAlerts.size() + " out of " + alerts.size() + " total alerts");
        return filteredAlerts;
    }

    /**
     * Check if a user should see an alert based on department access
     */
    private boolean shouldUserSeeAlert(User user, Alert alert) {
        if (alert.getItem() == null) {
            return true; // Show alerts with missing item data
        }

        // ADMIN users see alerts for their department + public items
        if (user.getRole() == User.UserRole.ADMIN) {
            // Public items (no department) - all admins can see
            if (alert.getItem().isPublic()) {
                return true;
            }
            
            // Department-specific items - only admins from the same department
            return alert.getItem().getDepartment() != null && 
                   alert.getItem().getDepartment().equals(user.getDepartment());
        }

        // USER role - only public items
        if (user.getRole() == User.UserRole.USER) {
            return alert.getItem().isPublic();
        }

        return false; // Default deny
    }

    private AlertResponse convertToResponse(Alert alert) {
        try {
            AlertResponse.ItemSummary itemSummary = new AlertResponse.ItemSummary();
            
            // Ensure item is properly loaded
            if (alert.getItem() != null) {
                itemSummary.setId(alert.getItem().getId());
                itemSummary.setName(alert.getItem().getName());
                itemSummary.setCode(alert.getItem().getCode());
                itemSummary.setBarcode(alert.getItem().getBarcode());
            } else {
                // Create dummy item data if item is null
                itemSummary.setId(0L);
                itemSummary.setName("Unknown Item");
                itemSummary.setCode("N/A");
                itemSummary.setBarcode("N/A");
            }

            return new AlertResponse(
                alert.getId(),
                itemSummary,
                alert.getAlertType(),
                alert.getMessage(),
                alert.getCurrentInventory(),
                alert.getPendingPO(),
                alert.getUsedInventory(),
                alert.getSafetyStockThreshold(),
                alert.getResolved(),
                alert.getRead(),
                alert.getIgnored(),
                alert.getCreatedAt(),
                alert.getResolvedAt(),
                alert.getReadAt(),
                alert.getIgnoredAt()
            );
        } catch (Exception e) {
            System.err.println("Error converting alert to response: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error processing alert data", e);
        }
    }
} 