package com.inventory.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/owner/logs")
@PreAuthorize("hasRole('OWNER')")
public class LogController {
    
    private static final Logger logger = LoggerFactory.getLogger(LogController.class);
    private static final String LOG_FILE_PATH = "/app/logs/inventory.log";
    private static final String DOCKER_LOG_COMMAND = "docker logs inventory_backend_prod";
    private static final int MAX_LINES = 1000;
    
    @GetMapping("/application")
    public ResponseEntity<?> getApplicationLogs(@RequestParam(defaultValue = "100") int lines) {
        try {
            logger.info("OWNER user requesting application logs - lines: {}", lines);
            
            // Limit lines to prevent memory issues
            int requestedLines = Math.min(lines, MAX_LINES);
            
            Map<String, Object> response = new HashMap<>();
            
            // Try to read from log file first
            if (Files.exists(Paths.get(LOG_FILE_PATH))) {
                List<String> logLines = readLogFile(LOG_FILE_PATH, requestedLines);
                response.put("source", "file");
                response.put("logFile", LOG_FILE_PATH);
                response.put("lines", logLines);
                response.put("totalLines", logLines.size());
            } else {
                // Fallback to docker logs if file doesn't exist
                List<String> dockerLogs = getDockerLogsHelper(requestedLines);
                response.put("source", "docker");
                response.put("command", DOCKER_LOG_COMMAND);
                response.put("lines", dockerLogs);
                response.put("totalLines", dockerLogs.size());
            }
            
            response.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            response.put("requestedLines", requestedLines);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to retrieve application logs", e);
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to retrieve logs: " + e.getMessage(),
                "timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
            ));
        }
    }
    
    @GetMapping("/docker")
    public ResponseEntity<?> getDockerLogs(@RequestParam(defaultValue = "100") int lines) {
        try {
            logger.info("OWNER user requesting docker logs - lines: {}", lines);
            
            int requestedLines = Math.min(lines, MAX_LINES);
            List<String> dockerLogs = getDockerLogsHelper(requestedLines);
            
            Map<String, Object> response = new HashMap<>();
            response.put("source", "docker");
            response.put("command", DOCKER_LOG_COMMAND + " --tail " + requestedLines);
            response.put("lines", dockerLogs);
            response.put("totalLines", dockerLogs.size());
            response.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            response.put("requestedLines", requestedLines);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to retrieve docker logs", e);
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to retrieve docker logs: " + e.getMessage(),
                "timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
            ));
        }
    }
    
    @GetMapping("/system-status")
    public ResponseEntity<?> getSystemStatus() {
        try {
            logger.info("OWNER user requesting system status");
            
            Map<String, Object> status = new HashMap<>();
            
            // JVM Information
            Runtime runtime = Runtime.getRuntime();
            Map<String, Object> jvm = new HashMap<>();
            jvm.put("totalMemory", runtime.totalMemory());
            jvm.put("freeMemory", runtime.freeMemory());
            jvm.put("usedMemory", runtime.totalMemory() - runtime.freeMemory());
            jvm.put("maxMemory", runtime.maxMemory());
            jvm.put("availableProcessors", runtime.availableProcessors());
            
            // System Properties
            Map<String, Object> system = new HashMap<>();
            system.put("javaVersion", System.getProperty("java.version"));
            system.put("osName", System.getProperty("os.name"));
            system.put("osVersion", System.getProperty("os.version"));
            system.put("userTimezone", System.getProperty("user.timezone"));
            
            // Application Info
            Map<String, Object> app = new HashMap<>();
            app.put("activeProfiles", System.getProperty("spring.profiles.active", "default"));
            app.put("logFile", LOG_FILE_PATH);
            app.put("logFileExists", Files.exists(Paths.get(LOG_FILE_PATH)));
            
            status.put("jvm", jvm);
            status.put("system", system);
            status.put("application", app);
            status.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            
            return ResponseEntity.ok(status);
            
        } catch (Exception e) {
            logger.error("Failed to retrieve system status", e);
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to retrieve system status: " + e.getMessage(),
                "timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
            ));
        }
    }
    
    @GetMapping("/filtered")
    public ResponseEntity<?> getFilteredLogs(
            @RequestParam(defaultValue = "100") int lines,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String search) {
        try {
            logger.info("OWNER user requesting filtered logs - lines: {}, level: {}, search: {}", 
                lines, level, search);
            
            int requestedLines = Math.min(lines, MAX_LINES);
            List<String> allLogs;
            
            // Get logs from file or docker
            if (Files.exists(Paths.get(LOG_FILE_PATH))) {
                allLogs = readLogFile(LOG_FILE_PATH, requestedLines * 2); // Get more to filter
            } else {
                allLogs = getDockerLogsHelper(requestedLines * 2);
            }
            
            // Filter logs
            List<String> filteredLogs = allLogs.stream()
                .filter(line -> level == null || line.contains(level.toUpperCase()))
                .filter(line -> search == null || line.toLowerCase().contains(search.toLowerCase()))
                .limit(requestedLines)
                .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("lines", filteredLogs);
            response.put("totalLines", filteredLogs.size());
            response.put("filters", Map.of(
                "level", level != null ? level : "all",
                "search", search != null ? search : "none"
            ));
            response.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            response.put("requestedLines", requestedLines);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to retrieve filtered logs", e);
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to retrieve filtered logs: " + e.getMessage(),
                "timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
            ));
        }
    }
    
    private List<String> readLogFile(String filePath, int maxLines) throws IOException {
        Path path = Paths.get(filePath);
        if (!Files.exists(path)) {
            return Arrays.asList("Log file not found: " + filePath);
        }
        
        // Read last N lines efficiently
        List<String> allLines = Files.readAllLines(path);
        int startIndex = Math.max(0, allLines.size() - maxLines);
        return allLines.subList(startIndex, allLines.size());
    }
    
    private List<String> getDockerLogsHelper(int maxLines) {
        try {
            ProcessBuilder processBuilder = new ProcessBuilder(
                "docker", "logs", "--tail", String.valueOf(maxLines), "inventory_backend_prod"
            );
            Process process = processBuilder.start();
            
            List<String> logs = new ArrayList<>();
            
            // Read stdout
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    logs.add(line);
                }
            }
            
            // Read stderr
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    logs.add("[STDERR] " + line);
                }
            }
            
            process.waitFor();
            return logs;
            
        } catch (Exception e) {
            logger.error("Failed to execute docker logs command", e);
            return Arrays.asList("Failed to execute docker logs: " + e.getMessage());
        }
    }
} 