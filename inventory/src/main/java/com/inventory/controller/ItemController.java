package com.inventory.controller;

import com.inventory.dto.ItemCreateRequest;
import com.inventory.dto.ItemResponse;
import com.inventory.entity.Item;
import com.inventory.repository.ItemRepository;
import com.inventory.service.BarcodeService;
import com.inventory.service.PurchaseOrderService;
import com.inventory.service.QRCodeService;
import com.inventory.dto.PurchaseOrderRequest;
import com.inventory.entity.Item.ABCCategory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.util.*;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvException;

@RestController
@RequestMapping("/items")
public class ItemController {
    @Autowired
    private ItemRepository itemRepository;
    
    @Autowired
    private BarcodeService barcodeService;

    @Autowired
    private PurchaseOrderService purchaseOrderService;

    @Autowired
    private QRCodeService qrCodeService;

    @GetMapping
    public List<ItemResponse> getAllItems() {
        return itemRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ItemResponse> getItemById(@PathVariable Long id) {
        Optional<Item> item = itemRepository.findById(id);
        return item.map(i -> ResponseEntity.ok(convertToResponse(i)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ItemResponse createItem(@RequestBody ItemCreateRequest request) {
        // Validate required fields
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new RuntimeException("Item name is required");
        }
        if (request.getCode() == null || request.getCode().trim().isEmpty()) {
            throw new RuntimeException("Item code is required");
        }

        Item item = new Item();
        item.setName(request.getName());
        item.setDescription(request.getDescription());
        item.setEnglishDescription(request.getEnglishDescription());
        item.setCode(request.getCode().trim().toUpperCase());
        item.setCurrentInventory(request.getQuantity() != null ? request.getQuantity() : 0);
        item.setSafetyStockThreshold(request.getMinQuantity() != null ? request.getMinQuantity() : 0);
        item.setPendingPO(request.getPendingPO() != null ? request.getPendingPO() : 0);
        item.setLocation(request.getLocation());
        item.setEquipment(request.getEquipment());
        item.setCategory(request.getCategory() != null ? request.getCategory() : ABCCategory.C);
        item.setWeeklyData(request.getWeeklyData());
        
        // Generate barcode based on the provided code
        item.setBarcode(generateBarcodeFromCode(request.getCode()));
        
        // Generate QR code
        try {
            String qrCodeId = qrCodeService.generateQRCodeId();
            String qrCodeData = qrCodeService.generateQRCode(qrCodeId, item.getName());
            item.setQrCodeId(qrCodeId);
            item.setQrCodeData(qrCodeData);
        } catch (Exception e) {
            System.err.println("Failed to generate QR code for item: " + e.getMessage());
            // Don't fail the whole operation if QR code generation fails
        }
        
        Item savedItem = itemRepository.save(item);
        return convertToResponse(savedItem);
    }

    @PostMapping("/import-csv")
    public ResponseEntity<?> importItemsFromCSV(@RequestParam("file") MultipartFile file, Authentication authentication) {
        System.out.println("=== IMPORT DEBUG START ===");
        System.out.println("File received: " + (file != null ? "YES" : "NO"));
        
        if (file != null) {
            System.out.println("File name: " + file.getOriginalFilename());
            System.out.println("File size: " + file.getSize() + " bytes");
            System.out.println("File content type: " + file.getContentType());
        }
        
        if (file.isEmpty()) {
            System.out.println("ERROR: File is empty");
            return ResponseEntity.badRequest().body("File is empty");
        }

        try {
            List<Item> itemsToSave = new ArrayList<>();
            List<String> errors = new ArrayList<>();
            int skippedDuplicates = 0;
            
            String filename = file.getOriginalFilename();
            System.out.println("Processing file: " + filename);
            
            if (filename != null && (filename.endsWith(".xlsx") || filename.endsWith(".xls") || filename.endsWith(".xlsm"))) {
                System.out.println("Processing as Excel file");
                // Handle Excel files (including XLSM)
                itemsToSave = parseExcelFile(file, errors);
                System.out.println("Excel parsing completed. Items found: " + itemsToSave.size());
            } else if (filename != null && filename.endsWith(".csv")) {
                System.out.println("Processing as CSV file");
                // Handle CSV files
                itemsToSave = parseCSVFile(file, errors);
                System.out.println("CSV parsing completed. Items found: " + itemsToSave.size());
            } else {
                System.out.println("ERROR: Unsupported file format: " + filename);
                return ResponseEntity.badRequest().body("Unsupported file format. Please upload a CSV, Excel (XLSX, XLS), or Excel Macro-Enabled (XLSM) file.");
            }

            System.out.println("Parsing errors: " + errors.size());
            if (!errors.isEmpty()) {
                System.out.println("First few errors: " + errors.subList(0, Math.min(5, errors.size())));
            }

            // Save valid items and count duplicates
            List<Item> savedItems = new ArrayList<>();
            for (Item item : itemsToSave) {
                try {
                    // Check if item with this code already exists
                    if (itemRepository.findByCode(item.getCode()).isPresent()) {
                        skippedDuplicates++;
                        continue; // Skip duplicate instead of adding to errors
                    }
                    
                    item.setBarcode(generateBarcodeFromCode(item.getCode()));
                    
                    // Generate QR code for imported items
                    try {
                        String qrCodeId = qrCodeService.generateQRCodeId();
                        String qrCodeData = qrCodeService.generateQRCode(qrCodeId, item.getName());
                        item.setQrCodeId(qrCodeId);
                        item.setQrCodeData(qrCodeData);
                    } catch (Exception e) {
                        System.err.println("Failed to generate QR code for imported item " + item.getCode() + ": " + e.getMessage());
                        // Don't fail the whole operation if QR code generation fails
                    }
                    
                    // Store the pending PO quantity before saving (since we'll reset it to 0)
                    Integer pendingPOQuantity = item.getPendingPO();
                    item.setPendingPO(0); // Reset to 0, will be calculated from actual POs
                    
                    Item saved = itemRepository.save(item);
                    savedItems.add(saved);
                    
                    // Create PO if there was a pending PO quantity from import
                    if (pendingPOQuantity != null && pendingPOQuantity > 0) {
                        try {
                            PurchaseOrderRequest poRequest = new PurchaseOrderRequest();
                            poRequest.setItemId(saved.getId());
                            poRequest.setQuantity(pendingPOQuantity);
                            poRequest.setTrackingNumber("IMPORT-" + saved.getCode());
                            
                            String username = authentication != null ? authentication.getName() : "SYSTEM_IMPORT";
                            purchaseOrderService.createPurchaseOrder(poRequest, username);
                            System.out.println("Created PO for item " + saved.getCode() + " with quantity " + pendingPOQuantity);
                        } catch (Exception poException) {
                            System.out.println("Error creating PO for item " + saved.getCode() + ": " + poException.getMessage());
                            errors.add("Error creating PO for item " + saved.getCode() + ": " + poException.getMessage());
                        }
                    }
                } catch (Exception e) {
                    System.out.println("Error saving item " + item.getCode() + ": " + e.getMessage());
                    errors.add("Error saving item " + item.getCode() + ": " + e.getMessage());
                }
            }

            System.out.println("=== IMPORT RESULTS ===");
            System.out.println("Total processed: " + (itemsToSave.size() + skippedDuplicates));
            System.out.println("Created: " + savedItems.size());
            System.out.println("Skipped duplicates: " + skippedDuplicates);
            System.out.println("Errors: " + errors.size());
            System.out.println("=== IMPORT DEBUG END ===");

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Import completed successfully");
            response.put("totalProcessed", itemsToSave.size() + skippedDuplicates);
            response.put("created", savedItems.size());
            response.put("skippedDuplicates", skippedDuplicates);
            response.put("errors", errors.size());
            response.put("errorDetails", errors);
            response.put("items", savedItems.stream().map(this::convertToResponse).collect(Collectors.toList()));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("EXCEPTION in import: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error processing file: " + e.getMessage());
        }
    }

    @GetMapping("/export-barcodes")
    public ResponseEntity<byte[]> exportAllBarcodes() {
        try {
            List<Item> items = itemRepository.findAll();
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ZipOutputStream zos = new ZipOutputStream(baos);

            for (Item item : items) {
                if (item.getBarcode() != null && !item.getBarcode().isEmpty()) {
                    // Generate barcode image as bytes
                    byte[] barcodeImage = barcodeService.generateBarcodeImage(item.getBarcode());
                    
                    // Add to ZIP
                    String filename = String.format("%s_%s.png", item.getCode(), item.getBarcode());
                    ZipEntry entry = new ZipEntry(filename);
                    zos.putNextEntry(entry);
                    zos.write(barcodeImage);
                    zos.closeEntry();
                }
            }

            zos.close();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "all_barcodes.zip");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(baos.toByteArray());
                    
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ItemResponse> updateItem(@PathVariable Long id, @RequestBody ItemCreateRequest request) {
        Optional<Item> optionalItem = itemRepository.findById(id);
        if (optionalItem.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        // Validate required fields
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new RuntimeException("Item name is required");
        }
        if (request.getCode() == null || request.getCode().trim().isEmpty()) {
            throw new RuntimeException("Item code is required");
        }

        Item item = optionalItem.get();
        item.setName(request.getName());
        item.setDescription(request.getDescription());
        item.setEnglishDescription(request.getEnglishDescription());
        item.setCode(request.getCode().trim().toUpperCase());
        item.setCurrentInventory(request.getQuantity() != null ? request.getQuantity() : 0);
        item.setSafetyStockThreshold(request.getMinQuantity() != null ? request.getMinQuantity() : 0);
        item.setPendingPO(request.getPendingPO() != null ? request.getPendingPO() : 0);
        item.setLocation(request.getLocation());
        item.setEquipment(request.getEquipment());
        item.setCategory(request.getCategory() != null ? request.getCategory() : ABCCategory.C);
        item.setWeeklyData(request.getWeeklyData());
        
        // Update barcode if code changed
        if (!item.getBarcode().equals(generateBarcodeFromCode(request.getCode()))) {
            item.setBarcode(generateBarcodeFromCode(request.getCode()));
        }
        
        Item savedItem = itemRepository.save(item);
        return ResponseEntity.ok(convertToResponse(savedItem));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        if (!itemRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        
        itemRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/bulk")
    public ResponseEntity<Map<String, Object>> deleteItems(@RequestBody List<Long> itemIds) {
        Map<String, Object> response = new HashMap<>();
        List<Long> deletedIds = new ArrayList<>();
        List<Long> notFoundIds = new ArrayList<>();
        
        for (Long id : itemIds) {
            if (itemRepository.existsById(id)) {
                itemRepository.deleteById(id);
                deletedIds.add(id);
            } else {
                notFoundIds.add(id);
            }
        }
        
        response.put("deleted", deletedIds.size());
        response.put("notFound", notFoundIds.size());
        response.put("deletedIds", deletedIds);
        response.put("notFoundIds", notFoundIds);
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/regenerate-qr-codes")
    public ResponseEntity<Map<String, Object>> regenerateQRCodes() {
        try {
            List<Item> itemsWithoutQR = itemRepository.findAll().stream()
                    .filter(item -> item.getQrCodeId() == null || item.getQrCodeData() == null)
                    .collect(Collectors.toList());
            
            int successCount = 0;
            int errorCount = 0;
            List<String> errors = new ArrayList<>();
            
            for (Item item : itemsWithoutQR) {
                try {
                    String qrCodeId = qrCodeService.generateQRCodeId();
                    String qrCodeData = qrCodeService.generateQRCode(qrCodeId, item.getName());
                    item.setQrCodeId(qrCodeId);
                    item.setQrCodeData(qrCodeData);
                    itemRepository.save(item);
                    successCount++;
                } catch (Exception e) {
                    errorCount++;
                    errors.add("Failed to generate QR code for item " + item.getCode() + ": " + e.getMessage());
                    System.err.println("Failed to generate QR code for item " + item.getCode() + ": " + e.getMessage());
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "QR code regeneration completed");
            response.put("totalProcessed", itemsWithoutQR.size());
            response.put("successful", successCount);
            response.put("errors", errorCount);
            response.put("errorDetails", errors);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error in QR code regeneration: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(
                Map.of("error", "Failed to regenerate QR codes: " + e.getMessage())
            );
        }
    }

    @GetMapping("/qr-debug")
    public ResponseEntity<Map<String, Object>> getQRCodeDebugInfo() {
        try {
            List<Item> allItems = itemRepository.findAll();
            
            long totalItems = allItems.size();
            long itemsWithQRId = allItems.stream().filter(item -> item.getQrCodeId() != null).count();
            long itemsWithQRData = allItems.stream().filter(item -> item.getQrCodeData() != null).count();
            long itemsWithBothQR = allItems.stream().filter(item -> item.getQrCodeId() != null && item.getQrCodeData() != null).count();
            
            // Sample of items without QR codes
            List<String> itemsWithoutQR = allItems.stream()
                    .filter(item -> item.getQrCodeId() == null || item.getQrCodeData() == null)
                    .limit(5)
                    .map(item -> "ID: " + item.getId() + ", Code: " + item.getCode() + ", Name: " + item.getName() + 
                                 ", QRId: " + (item.getQrCodeId() != null ? "YES" : "NO") + 
                                 ", QRData: " + (item.getQrCodeData() != null ? "YES" : "NO"))
                    .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("totalItems", totalItems);
            response.put("itemsWithQRId", itemsWithQRId);
            response.put("itemsWithQRData", itemsWithQRData);
            response.put("itemsWithBothQR", itemsWithBothQR);
            response.put("itemsWithoutQRSample", itemsWithoutQR);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error in QR debug: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(
                Map.of("error", "Failed to get QR debug info: " + e.getMessage())
            );
        }
    }

    private List<Item> parseExcelFile(MultipartFile file, List<String> errors) throws IOException {
        List<Item> items = new ArrayList<>();
        
        Workbook workbook;
        try (InputStream is = file.getInputStream()) {
            // XLSM files are also OOXML format like XLSX, so use XSSFWorkbook for both
            if (file.getOriginalFilename().endsWith(".xlsx") || file.getOriginalFilename().endsWith(".xlsm")) {
                workbook = new XSSFWorkbook(is);
            } else {
                workbook = new HSSFWorkbook(is);
            }
            
            Sheet sheet = workbook.getSheetAt(0);
            
            // Read header row to understand column structure
            Row headerRow = sheet.getRow(0);
            Map<String, Integer> columnMap = new HashMap<>();
            
            if (headerRow != null) {
                for (int i = 0; i < headerRow.getLastCellNum(); i++) {
                    Cell cell = headerRow.getCell(i);
                    if (cell != null) {
                        String headerName = getCellValueAsString(cell);
                        if (headerName != null) {
                            String normalizedHeader = headerName.trim().toLowerCase();
                            columnMap.put(normalizedHeader, i);
                            System.out.println("Column " + i + ": '" + headerName + "' -> normalized: '" + normalizedHeader + "'");
                        }
                    }
                }
            }
            
            System.out.println("Complete column map: " + columnMap);
            
            boolean isFirstRow = true;
            for (Row row : sheet) {
                if (isFirstRow) {
                    isFirstRow = false;
                    continue; // Skip header row
                }
                
                try {
                    Item item = parseRowToItemWithHeaders(row, columnMap, errors);
                    if (item != null) {
                        items.add(item);
                    }
                } catch (Exception e) {
                    errors.add("Error parsing row " + (row.getRowNum() + 1) + ": " + e.getMessage());
                }
            }
            
            workbook.close();
        }
        
        return items;
    }

    private List<Item> parseCSVFile(MultipartFile file, List<String> errors) throws IOException {
        List<Item> items = new ArrayList<>();
        
        try (Reader reader = new InputStreamReader(file.getInputStream());
             CSVReader csvReader = new CSVReader(reader)) {
            
            List<String[]> records = csvReader.readAll();
            if (records.isEmpty()) {
                return items;
            }
            
            // Read header row to understand column structure
            String[] headers = records.get(0);
            Map<String, Integer> columnMap = new HashMap<>();
            
            for (int i = 0; i < headers.length; i++) {
                if (headers[i] != null) {
                    String normalizedHeader = headers[i].trim().toLowerCase();
                    columnMap.put(normalizedHeader, i);
                    System.out.println("CSV Column " + i + ": '" + headers[i] + "' -> normalized: '" + normalizedHeader + "'");
                }
            }
            
            System.out.println("Complete CSV column map: " + columnMap);
            
            for (int i = 1; i < records.size(); i++) { // Start from 1 to skip header
                try {
                    String[] row = records.get(i);
                    Item item = parseArrayToItemWithHeaders(row, columnMap, errors, i + 1);
                    if (item != null) {
                        items.add(item);
                    }
                } catch (Exception e) {
                    errors.add("Error parsing row " + (i + 1) + ": " + e.getMessage());
                }
            }
        } catch (CsvException e) {
            errors.add("CSV parsing error: " + e.getMessage());
        }
        
        return items;
    }

    private Item parseRowToItemWithHeaders(Row row, Map<String, Integer> columnMap, List<String> errors) {
        try {
            Item item = new Item();
            
            // Use flexible column mapping based on headers
            String partNumber = getValueByColumnName(row, columnMap, "part number");
            String description = getValueByColumnName(row, columnMap, "description");
            String englishDescription = getValueByColumnName(row, columnMap, "english description");
            String location = getValueByColumnName(row, columnMap, "location");
            String equipment = getValueByColumnName(row, columnMap, "equipment");
            Integer previousInventory = getIntValueByColumnName(row, columnMap, "previous wk inventory");
            Integer currentInventory = getIntValueByColumnName(row, columnMap, "current inventory");
            Integer openPOnTheWay = getIntValueByColumnName(row, columnMap, "open p on the way");
            
            // Handle optional Safety Stock column
            Integer safetyStock = getIntValueByColumnName(row, columnMap, "safety stock");

            // Debug location specifically
            System.out.println("Row " + row.getRowNum() + " - Description: '" + description + "', Location: '" + location + "'");

            if (description == null || description.trim().isEmpty()) {
                return null; // Skip empty rows
            }

            item.setName(description);
            item.setDescription(description);
            item.setEnglishDescription(englishDescription);
            item.setCode(partNumber != null && !partNumber.trim().isEmpty() ? partNumber.trim() : generateItemCodeFromDescription(description));
            item.setLocation(location);
            item.setEquipment(equipment);
            item.setCurrentInventory(currentInventory != null ? currentInventory : 0);
            item.setPendingPO(openPOnTheWay != null ? openPOnTheWay : 0);
            item.setSafetyStockThreshold(safetyStock != null ? safetyStock : 0);
            item.setCategory(ABCCategory.C);

            // Handle weekly data columns - only parse actual week columns that exist
            StringBuilder weeklyData = new StringBuilder("{");
            boolean hasWeeklyData = false;
            
            for (Map.Entry<String, Integer> entry : columnMap.entrySet()) {
                String columnName = entry.getKey();
                Integer columnIndex = entry.getValue();
                
                // Check if this is a week column (starts with "wk" followed by numbers)
                if (columnName.startsWith("wk") && columnName.length() > 2) {
                    try {
                        String weekNumberStr = columnName.substring(2);
                        Integer weekNumber = Integer.parseInt(weekNumberStr);
                        Integer weekValue = getCellValueAsInteger(row.getCell(columnIndex));
                        
                        if (weekValue != null) {
                            if (hasWeeklyData) weeklyData.append(",");
                            weeklyData.append("\"").append(weekNumber).append("\":").append(weekValue);
                            hasWeeklyData = true;
                        }
                    } catch (NumberFormatException e) {
                        // Skip invalid week column names
                    }
                }
            }
            weeklyData.append("}");
            
            if (hasWeeklyData) {
                item.setWeeklyData(weeklyData.toString());
            }

            return item;
        } catch (Exception e) {
            errors.add("Error parsing row: " + e.getMessage());
            return null;
        }
    }

    private Item parseArrayToItemWithHeaders(String[] row, Map<String, Integer> columnMap, List<String> errors, int rowNum) {
        try {
            if (row.length < 2) {
                return null; // Skip incomplete rows
            }

            Item item = new Item();
            
            // Use flexible column mapping based on headers
            String partNumber = getValueByColumnName(row, columnMap, "part number");
            String description = getValueByColumnName(row, columnMap, "description");
            String englishDescription = getValueByColumnName(row, columnMap, "english description");
            String location = getValueByColumnName(row, columnMap, "location");
            String equipment = getValueByColumnName(row, columnMap, "equipment");
            Integer previousInventory = getIntValueByColumnName(row, columnMap, "previous wk inventory");
            Integer currentInventory = getIntValueByColumnName(row, columnMap, "current inventory");
            Integer openPOnTheWay = getIntValueByColumnName(row, columnMap, "open p on the way");
            
            // Handle optional Safety Stock column
            Integer safetyStock = getIntValueByColumnName(row, columnMap, "safety stock");

            // Debug location specifically
            System.out.println("Row " + rowNum + " - Description: '" + description + "', Location: '" + location + "'");

            if (description == null || description.trim().isEmpty()) {
                return null; // Skip empty rows
            }

            item.setName(description);
            item.setDescription(description);
            item.setEnglishDescription(englishDescription);
            item.setCode(partNumber != null && !partNumber.trim().isEmpty() ? partNumber.trim() : generateItemCodeFromDescription(description));
            item.setLocation(location);
            item.setEquipment(equipment);
            item.setCurrentInventory(currentInventory != null ? currentInventory : 0);
            item.setPendingPO(openPOnTheWay != null ? openPOnTheWay : 0);
            item.setSafetyStockThreshold(safetyStock != null ? safetyStock : 0);
            item.setCategory(ABCCategory.C);

            // Handle weekly data columns - only parse actual week columns that exist
            StringBuilder weeklyData = new StringBuilder("{");
            boolean hasWeeklyData = false;
            
            for (Map.Entry<String, Integer> entry : columnMap.entrySet()) {
                String columnName = entry.getKey();
                Integer columnIndex = entry.getValue();
                
                // Check if this is a week column (starts with "wk" followed by numbers)
                if (columnName.startsWith("wk") && columnName.length() > 2) {
                    try {
                        String weekNumberStr = columnName.substring(2);
                        Integer weekNumber = Integer.parseInt(weekNumberStr);
                        
                        if (columnIndex < row.length) {
                            Integer weekValue = parseInteger(row[columnIndex]);
                            if (weekValue != null) {
                                if (hasWeeklyData) weeklyData.append(",");
                                weeklyData.append("\"").append(weekNumber).append("\":").append(weekValue);
                                hasWeeklyData = true;
                            }
                        }
                    } catch (NumberFormatException e) {
                        // Skip invalid week column names
                    }
                }
            }
            weeklyData.append("}");
            
            if (hasWeeklyData) {
                item.setWeeklyData(weeklyData.toString());
            }

            return item;
        } catch (Exception e) {
            errors.add("Error parsing row " + rowNum + ": " + e.getMessage());
            return null;
        }
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return null;
        
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                return String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                // Handle formulas by getting the evaluated result
                try {
                    switch (cell.getCachedFormulaResultType()) {
                        case STRING:
                            return cell.getStringCellValue();
                        case NUMERIC:
                            return String.valueOf((long) cell.getNumericCellValue());
                        case BOOLEAN:
                            return String.valueOf(cell.getBooleanCellValue());
                        default:
                            return null;
                    }
                } catch (Exception e) {
                    System.out.println("Error evaluating formula in cell: " + e.getMessage());
                    return null;
                }
            default:
                return null;
        }
    }

    private Integer getCellValueAsInteger(Cell cell) {
        if (cell == null) return null;
        
        switch (cell.getCellType()) {
            case NUMERIC:
                return (int) cell.getNumericCellValue();
            case STRING:
                try {
                    return Integer.parseInt(cell.getStringCellValue());
                } catch (NumberFormatException e) {
                    return null;
                }
            case FORMULA:
                // Handle formulas by getting the evaluated result
                try {
                    switch (cell.getCachedFormulaResultType()) {
                        case NUMERIC:
                            return (int) cell.getNumericCellValue();
                        case STRING:
                            try {
                                return Integer.parseInt(cell.getStringCellValue());
                            } catch (NumberFormatException e) {
                                return null;
                            }
                        default:
                            return null;
                    }
                } catch (Exception e) {
                    System.out.println("Error evaluating formula for integer: " + e.getMessage());
                    return null;
                }
            default:
                return null;
        }
    }

    private Integer parseInteger(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    // Helper methods for column-based parsing
    private String getValueByColumnName(Row row, Map<String, Integer> columnMap, String columnName) {
        Integer columnIndex = findColumnIndex(columnMap, columnName);
        if (columnIndex != null && columnIndex < row.getLastCellNum()) {
            String value = getCellValueAsString(row.getCell(columnIndex));
            System.out.println("Getting '" + columnName + "' from column " + columnIndex + ": '" + value + "'");
            return value;
        }
        System.out.println("Column '" + columnName + "' not found in: " + columnMap.keySet());
        return null;
    }

    private String getValueByColumnName(String[] row, Map<String, Integer> columnMap, String columnName) {
        Integer columnIndex = findColumnIndex(columnMap, columnName);
        if (columnIndex != null && columnIndex < row.length) {
            String value = row[columnIndex];
            System.out.println("Getting '" + columnName + "' from column " + columnIndex + ": '" + value + "'");
            return value;
        }
        System.out.println("Column '" + columnName + "' not found in: " + columnMap.keySet());
        return null;
    }

    private Integer getIntValueByColumnName(Row row, Map<String, Integer> columnMap, String columnName) {
        Integer columnIndex = findColumnIndex(columnMap, columnName);
        if (columnIndex != null && columnIndex < row.getLastCellNum()) {
            return getCellValueAsInteger(row.getCell(columnIndex));
        }
        return null;
    }

    private Integer getIntValueByColumnName(String[] row, Map<String, Integer> columnMap, String columnName) {
        Integer columnIndex = findColumnIndex(columnMap, columnName);
        if (columnIndex != null && columnIndex < row.length) {
            return parseInteger(row[columnIndex]);
        }
        return null;
    }

    private Integer findColumnIndex(Map<String, Integer> columnMap, String targetColumn) {
        String normalized = targetColumn.toLowerCase();
        
        // Direct match first
        if (columnMap.containsKey(normalized)) {
            return columnMap.get(normalized);
        }
        
        // Try common variations
        for (Map.Entry<String, Integer> entry : columnMap.entrySet()) {
            String columnName = entry.getKey();
            
            // Handle variations like spaces, punctuation
            if (columnName.replaceAll("[\\s_-]", "").equals(normalized.replaceAll("[\\s_-]", ""))) {
                return entry.getValue();
            }
            
            // Handle partial matches for common field names
            if (normalized.equals("location") && columnName.contains("location")) {
                return entry.getValue();
            }
            if (normalized.equals("description") && columnName.contains("description") && !columnName.contains("english")) {
                return entry.getValue();
            }
            if (normalized.equals("english description") && columnName.contains("english") && columnName.contains("description")) {
                return entry.getValue();
            }
        }
        
        return null;
    }

    private String generateItemCodeFromDescription(String description) {
        if (description == null || description.trim().isEmpty()) {
            return "ITEM_" + System.currentTimeMillis();
        }
        // Create a code from description - take first few characters and add timestamp
        String cleanDescription = description.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        String prefix = cleanDescription.length() > 6 ? cleanDescription.substring(0, 6) : cleanDescription;
        return prefix + "_" + (System.currentTimeMillis() % 10000);
    }

    private String generateBarcodeFromCode(String code) {
        // Generate a barcode based on the item code
        // Using a deterministic approach for consistency
        String cleanCode = code.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        
        if (cleanCode.length() >= 8) {
            // If code is long enough, use it directly with a checksum
            int checksum = cleanCode.hashCode() % 1000;
            return cleanCode.substring(0, 8) + String.format("%03d", Math.abs(checksum));
        } else {
            // For shorter codes, pad with hash and timestamp
            int codeHash = Math.abs(cleanCode.hashCode());
            String paddedHash = String.format("%06d", codeHash % 1000000);
            long timestamp = System.currentTimeMillis();
            String timeComponent = String.valueOf(timestamp).substring(7); // Last 6 digits
            
            return cleanCode + paddedHash.substring(0, Math.max(0, 11 - cleanCode.length())) + timeComponent.substring(0, Math.min(timeComponent.length(), 3));
        }
    }

    private String generateItemCode(String name) {
        // Keep this method for backward compatibility but it shouldn't be used for new items
        if (name == null || name.trim().isEmpty()) {
            return "ITEM_" + System.currentTimeMillis();
        }
        return name.replaceAll("[^a-zA-Z0-9]", "").toUpperCase().substring(0, Math.min(name.length(), 8)) + "_" + System.currentTimeMillis() % 10000;
    }

    private ItemResponse convertToResponse(Item item) {
        // Calculate used inventory from usage records
        Integer usedInventory = item.getUsedInventory() != null ? item.getUsedInventory() : 0;
        
        // Get pending PO (for now, defaulting to 0 - can be enhanced later)
        Integer pendingPO = item.getPendingPO() != null ? item.getPendingPO() : 0;
        
        // Calculate available quantity - currentInventory already reflects usage, so just add pending PO
        Integer currentInventory = item.getCurrentInventory() != null ? item.getCurrentInventory() : 0;
        Integer availableQuantity = Math.max(0, currentInventory + pendingPO);
        
        // Check if needs restock
        Integer safetyStock = item.getSafetyStockThreshold() != null ? item.getSafetyStockThreshold() : 0;
        boolean needsRestock = availableQuantity <= safetyStock;
        
        ItemResponse response = new ItemResponse();
        response.setId(item.getId());
        response.setName(item.getName());
        response.setDescription(item.getDescription());
        response.setEnglishDescription(item.getEnglishDescription());
        response.setCode(item.getCode());
        response.setQuantity(currentInventory);
        response.setMinQuantity(safetyStock);
        response.setLocation(item.getLocation());
        response.setEquipment(item.getEquipment());
        response.setCategory(item.getCategory());
        response.setBarcode(item.getBarcode());
        response.setQrCodeId(item.getQrCodeId());
        response.setQrCodeData(item.getQrCodeData());
        if (item.getQrCodeId() != null) {
            response.setQrCodeUrl(qrCodeService.getQRCodeUrl(item.getQrCodeId()));
        }
        response.setUsedInventory(usedInventory);
        response.setPendingPO(pendingPO);
        response.setAvailableQuantity(availableQuantity);
        response.setNeedsRestock(needsRestock);
        
        return response;
    }
} 