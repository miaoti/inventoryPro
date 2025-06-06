package com.inventory.service;

import com.inventory.entity.Usage;
import com.inventory.entity.Alert;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ExcelExportService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public byte[] exportUsageToExcel(List<Usage> usageRecords) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Usage Report");

            // Create header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 12);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Create header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {
                "ID", "User Name", "Department", "D Number", "Item Name", "Item Code", 
                "Barcode", "Quantity Used", "Notes", "Used At", "Location"
            };

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Fill data rows
            int rowNum = 1;
            for (Usage usage : usageRecords) {
                Row row = sheet.createRow(rowNum++);
                
                row.createCell(0).setCellValue(usage.getId());
                row.createCell(1).setCellValue(usage.getUserName());
                row.createCell(2).setCellValue(usage.getDepartment() != null ? usage.getDepartment() : "");
                row.createCell(3).setCellValue(usage.getDNumber() != null ? usage.getDNumber() : "");
                row.createCell(4).setCellValue(usage.getItem().getName());
                row.createCell(5).setCellValue(usage.getItem().getCode());
                row.createCell(6).setCellValue(usage.getBarcode());
                row.createCell(7).setCellValue(usage.getQuantityUsed());
                row.createCell(8).setCellValue(usage.getNotes() != null ? usage.getNotes() : "");
                row.createCell(9).setCellValue(usage.getUsedAt().format(DATE_FORMATTER));
                row.createCell(10).setCellValue(usage.getItem().getLocation() != null ? usage.getItem().getLocation() : "");
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            // Write to byte array
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }

    public byte[] exportAlertsToExcel(List<Alert> alerts) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Alerts Report");

            // Create header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 12);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_ORANGE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Create header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {
                "ID", "Item Name", "Item Code", "Alert Type", "Message", "Current Inventory", 
                "Pending PO", "Used Inventory", "Safety Threshold", "Effective Inventory",
                "Resolved", "Read", "Created At", "Resolved At", "Read At"
            };

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Create styles for different alert types
            CellStyle criticalStyle = workbook.createCellStyle();
            criticalStyle.setFillForegroundColor(IndexedColors.RED.getIndex());
            criticalStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle warningStyle = workbook.createCellStyle();
            warningStyle.setFillForegroundColor(IndexedColors.YELLOW.getIndex());
            warningStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Fill data rows
            int rowNum = 1;
            for (Alert alert : alerts) {
                Row row = sheet.createRow(rowNum++);
                
                row.createCell(0).setCellValue(alert.getId());
                row.createCell(1).setCellValue(alert.getItem().getName());
                row.createCell(2).setCellValue(alert.getItem().getCode());
                row.createCell(3).setCellValue(alert.getAlertType());
                row.createCell(4).setCellValue(alert.getMessage());
                row.createCell(5).setCellValue(alert.getCurrentInventory());
                row.createCell(6).setCellValue(alert.getPendingPO());
                row.createCell(7).setCellValue(alert.getUsedInventory());
                row.createCell(8).setCellValue(alert.getSafetyStockThreshold());
                
                int effectiveInventory = alert.getCurrentInventory() + alert.getPendingPO();
                Cell effectiveCell = row.createCell(9);
                effectiveCell.setCellValue(effectiveInventory);
                
                // Color code based on severity
                if (effectiveInventory < alert.getSafetyStockThreshold() * 0.5) {
                    effectiveCell.setCellStyle(criticalStyle);
                } else if (effectiveInventory < alert.getSafetyStockThreshold()) {
                    effectiveCell.setCellStyle(warningStyle);
                }
                
                row.createCell(10).setCellValue(alert.getResolved() ? "Yes" : "No");
                row.createCell(11).setCellValue(alert.getRead() ? "Yes" : "No");
                row.createCell(12).setCellValue(alert.getCreatedAt().format(DATE_FORMATTER));
                row.createCell(13).setCellValue(alert.getResolvedAt() != null ? alert.getResolvedAt().format(DATE_FORMATTER) : "");
                row.createCell(14).setCellValue(alert.getReadAt() != null ? alert.getReadAt().format(DATE_FORMATTER) : "");
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            // Write to byte array
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }
} 