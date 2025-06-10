package com.inventory.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/owner/logs")
@PreAuthorize("hasRole('OWNER')")
public class OwnerLogsController {
    
    private static final Logger logger = LoggerFactory.getLogger(OwnerLogsController.class);
    
    @Value("${logging.file.name:/app/logs/inventory.log}")
    private String logFilePath;
    
    private static final int MAX_LOG_LINES = 1000;
    private static final List<String> SENSITIVE_PATTERNS = Arrays.asList(
        "password", "secret", "token", "key", "credential"
    );
    
    @GetMapping("/recent")
    public ResponseEntity<?> getRecentLogs(
            @RequestParam(defaultValue = "100") int lines,
            @RequestParam(defaultValue = "INFO") String level) {
        
        try {
            logger.info("OWNER requesting recent logs - lines: {}, level: {}", lines, level);
            
            // Limit lines to prevent memory issues
            int requestedLines = Math.min(lines, MAX_LOG_LINES);
            
            List<String> logLines = getLastNLines(logFilePath, requestedLines);
            
            // Filter by log level if specified
            if (!"ALL".equalsIgnoreCase(level)) {
                logLines = filterByLogLevel(logLines, level);
            }
            
            // Remove sensitive information
            logLines = sanitizeLogs(logLines);
            
            Map<String, Object> response = new HashMap<>();
            response.put("logs", logLines);
            response.put("totalLines", logLines.size());
            response.put("requestedLines", requestedLines);
            response.put("level", level);
            response.put("logFile", logFilePath);
            response.put("timestamp", new Date());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error retrieving logs for OWNER", e);
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to retrieve logs: " + e.getMessage(),
                "logFile", logFilePath
            ));
        }
    }
    
    @GetMapping("/search")
    public ResponseEntity<?> searchLogs(
            @RequestParam String query,
            @RequestParam(defaultValue = "100") int maxResults) {
        
        try {
            logger.info("OWNER searching logs for: {}", query);
            
            List<String> allLines = getLastNLines(logFilePath, MAX_LOG_LINES);
            
            // Search for lines containing the query (case-insensitive)
            List<String> matchingLines = allLines.stream()
                .filter(line -> line.toLowerCase().contains(query.toLowerCase()))
                .limit(Math.min(maxResults, 200))
                .collect(Collectors.toList());
            
            // Remove sensitive information
            matchingLines = sanitizeLogs(matchingLines);
            
            Map<String, Object> response = new HashMap<>();
            response.put("logs", matchingLines);
            response.put("totalMatches", matchingLines.size());
            response.put("query", query);
            response.put("timestamp", new Date());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error searching logs for OWNER", e);
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to search logs: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/email-logs")
    public ResponseEntity<?> getEmailLogs(@RequestParam(defaultValue = "50") int lines) {
        try {
            logger.info("OWNER requesting email-specific logs");
            
            List<String> allLines = getLastNLines(logFilePath, MAX_LOG_LINES);
            
            // Filter for email-related logs
            List<String> emailLines = allLines.stream()
                .filter(line -> 
                    line.contains("EMAIL") || 
                    line.contains("mail") || 
                    line.contains("smtp") || 
                    line.contains("AlertService") ||
                    line.contains("EmailService") ||
                    line.contains("notification")
                )
                .limit(Math.min(lines, 200))
                .collect(Collectors.toList());
            
            // Remove sensitive information
            emailLines = sanitizeLogs(emailLines);
            
            Map<String, Object> response = new HashMap<>();
            response.put("logs", emailLines);
            response.put("totalLines", emailLines.size());
            response.put("type", "email");
            response.put("timestamp", new Date());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error retrieving email logs for OWNER", e);
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to retrieve email logs: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/system-status")
    public ResponseEntity<?> getSystemStatus() {
        try {
            Map<String, Object> status = new HashMap<>();
            
            // Log file information
            File logFile = new File(logFilePath);
            status.put("logFileExists", logFile.exists());
            status.put("logFileSize", logFile.exists() ? logFile.length() : 0);
            status.put("logFileLastModified", logFile.exists() ? new Date(logFile.lastModified()) : null);
            
            // System information
            Runtime runtime = Runtime.getRuntime();
            status.put("memoryUsed", runtime.totalMemory() - runtime.freeMemory());
            status.put("memoryTotal", runtime.totalMemory());
            status.put("memoryMax", runtime.maxMemory());
            status.put("processors", runtime.availableProcessors());
            
            // Recent error count
            List<String> recentLines = getLastNLines(logFilePath, 500);
            long errorCount = recentLines.stream()
                .filter(line -> line.contains(" ERROR "))
                .count();
            long warnCount = recentLines.stream()
                .filter(line -> line.contains(" WARN "))
                .count();
            
            status.put("recentErrors", errorCount);
            status.put("recentWarnings", warnCount);
            status.put("timestamp", new Date());
            
            return ResponseEntity.ok(status);
            
        } catch (Exception e) {
            logger.error("Error getting system status for OWNER", e);
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to get system status: " + e.getMessage()
            ));
        }
    }
    
    private List<String> getLastNLines(String filePath, int n) throws IOException {
        if (!Files.exists(Paths.get(filePath))) {
            return Arrays.asList("Log file not found: " + filePath);
        }
        
        List<String> lines = Files.readAllLines(Paths.get(filePath));
        int size = lines.size();
        
        if (size <= n) {
            return lines;
        }
        
        return lines.subList(size - n, size);
    }
    
    private List<String> filterByLogLevel(List<String> lines, String level) {
        String levelPattern = " " + level.toUpperCase() + " ";
        return lines.stream()
            .filter(line -> line.contains(levelPattern))
            .collect(Collectors.toList());
    }
    
    private List<String> sanitizeLogs(List<String> lines) {
        return lines.stream()
            .map(this::sanitizeLine)
            .collect(Collectors.toList());
    }
    
    private String sanitizeLine(String line) {
        String sanitized = line;
        
        // Remove or mask sensitive information
        for (String pattern : SENSITIVE_PATTERNS) {
            if (line.toLowerCase().contains(pattern)) {
                // Mask sensitive values but keep structure for debugging
                sanitized = sanitized.replaceAll(
                    "(?i)(" + pattern + "\\s*[:=]\\s*)([^\\s,}]+)", 
                    "$1***MASKED***"
                );
            }
        }
        
        return sanitized;
    }
} 