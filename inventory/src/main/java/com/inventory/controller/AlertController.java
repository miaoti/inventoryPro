package com.inventory.controller;

import com.inventory.dto.AlertResponse;
import com.inventory.entity.Alert;
import com.inventory.service.AlertService;
import com.inventory.service.ExcelExportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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

    @GetMapping
    public List<AlertResponse> getAllAlerts() {
        return alertService.getAllAlerts().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @GetMapping("/active")
    public List<AlertResponse> getActiveAlerts() {
        return alertService.getActiveAlerts().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @GetMapping("/ignored")
    public List<AlertResponse> getIgnoredAlerts() {
        return alertService.getIgnoredAlerts().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @GetMapping("/resolved")
    public List<AlertResponse> getResolvedAlerts() {
        return alertService.getResolvedAlerts().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @GetMapping("/count")
    public Map<String, Long> getActiveAlertCount() {
        return Map.of(
            "activeAlerts", alertService.getActiveAlertCount(),
            "unreadAlerts", alertService.getUnreadAlertCount()
        );
    }

    @GetMapping("/unread")
    public List<AlertResponse> getUnreadAlerts() {
        return alertService.getUnreadAlerts().stream()
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
            List<Alert> alerts = alertService.getAllAlerts();
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