package com.inventory.controller;

import com.inventory.entity.SystemLog;
import com.inventory.entity.User;
import com.inventory.service.SystemLogService;
import com.inventory.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/system-logs")
@PreAuthorize("hasRole('OWNER')")
public class SystemLogController {
    
    @Autowired
    private SystemLogService systemLogService;
    
    @Autowired
    private UserService userService;
    
    /**
     * Get system logs with pagination and filters
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getSystemLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String username,
            @RequestParam(defaultValue = "timestamp") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            Principal principal,
            HttpServletRequest request) {
        
        try {
            // Create pageable with sorting
            Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
            Pageable pageable = PageRequest.of(page, size, sort);
            
            // Convert string parameters to enums
            SystemLog.LogLevel logLevel = null;
            SystemLog.LogModule logModule = null;
            
            if (level != null && !level.isEmpty() && !level.equalsIgnoreCase("ALL")) {
                try {
                    logLevel = SystemLog.LogLevel.valueOf(level.toUpperCase());
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid log level: " + level));
                }
            }
            
            if (module != null && !module.isEmpty() && !module.equalsIgnoreCase("ALL")) {
                try {
                    logModule = SystemLog.LogModule.valueOf(module.toUpperCase());
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid module: " + module));
                }
            }
            
            // Get filtered logs
            Page<SystemLog> logs = systemLogService.getLogsWithFilters(logLevel, logModule, username, pageable);
            
            // Log the access
            String clientIp = getClientIpAddress(request);
            systemLogService.createLog(
                SystemLog.LogLevel.INFO, 
                "VIEW_SYSTEM_LOGS", 
                principal.getName(), 
                "Viewed system logs with filters", 
                SystemLog.LogModule.SYSTEM, 
                clientIp
            );
            
            // Prepare response
            Map<String, Object> response = new HashMap<>();
            response.put("logs", logs.getContent());
            response.put("totalElements", logs.getTotalElements());
            response.put("totalPages", logs.getTotalPages());
            response.put("currentPage", logs.getNumber());
            response.put("pageSize", logs.getSize());
            response.put("hasNext", logs.hasNext());
            response.put("hasPrevious", logs.hasPrevious());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to retrieve system logs: " + e.getMessage()));
        }
    }
    
    /**
     * Get system log statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<SystemLogService.LogStatistics> getLogStatistics(
            Principal principal, HttpServletRequest request) {
        
        try {
            SystemLogService.LogStatistics stats = systemLogService.getLogStatistics();
            
            // Log the access
            String clientIp = getClientIpAddress(request);
            systemLogService.createLog(
                SystemLog.LogLevel.INFO, 
                "VIEW_LOG_STATISTICS", 
                principal.getName(), 
                "Viewed system log statistics", 
                SystemLog.LogModule.SYSTEM, 
                clientIp
            );
            
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(null);
        }
    }
    
    /**
     * Delete logs by IDs (Owner only)
     */
    @DeleteMapping("/bulk")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Map<String, Object>> deleteLogs(
            @RequestBody List<Long> logIds,
            Principal principal,
            HttpServletRequest request) {
        
        try {
            if (logIds == null || logIds.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No log IDs provided"));
            }
            
            int deletedCount = systemLogService.deleteLogsByIds(logIds);
            
            // Log the deletion
            String clientIp = getClientIpAddress(request);
            systemLogService.createLog(
                SystemLog.LogLevel.WARN, 
                "DELETE_SYSTEM_LOGS", 
                principal.getName(), 
                "Deleted " + deletedCount + " system log entries", 
                SystemLog.LogModule.SYSTEM, 
                clientIp
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("deletedCount", deletedCount);
            response.put("message", "Successfully deleted " + deletedCount + " log entries");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to delete logs: " + e.getMessage()));
        }
    }
    
    /**
     * Delete logs older than specified days (Owner only)
     */
    @DeleteMapping("/cleanup")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Map<String, Object>> deleteOldLogs(
            @RequestParam int days,
            Principal principal,
            HttpServletRequest request) {
        
        try {
            if (days < 1) {
                return ResponseEntity.badRequest().body(Map.of("error", "Days must be greater than 0"));
            }
            
            int deletedCount = systemLogService.deleteLogsOlderThan(days);
            
            // Log the cleanup
            String clientIp = getClientIpAddress(request);
            systemLogService.createLog(
                SystemLog.LogLevel.WARN, 
                "CLEANUP_SYSTEM_LOGS", 
                principal.getName(), 
                "Cleaned up " + deletedCount + " log entries older than " + days + " days", 
                SystemLog.LogModule.SYSTEM, 
                clientIp
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("deletedCount", deletedCount);
            response.put("message", "Successfully cleaned up " + deletedCount + " log entries older than " + days + " days");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to cleanup logs: " + e.getMessage()));
        }
    }
    
    /**
     * Get recent logs (last 24 hours)
     */
    @GetMapping("/recent")
    public ResponseEntity<List<SystemLog>> getRecentLogs(
            Principal principal,
            HttpServletRequest request) {
        
        try {
            List<SystemLog> recentLogs = systemLogService.getRecentLogs();
            
            // Log the access
            String clientIp = getClientIpAddress(request);
            systemLogService.createLog(
                SystemLog.LogLevel.INFO, 
                "VIEW_RECENT_LOGS", 
                principal.getName(), 
                "Viewed recent system logs", 
                SystemLog.LogModule.SYSTEM, 
                clientIp
            );
            
            return ResponseEntity.ok(recentLogs);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(null);
        }
    }
    
    /**
     * Get a specific log by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<SystemLog> getLogById(
            @PathVariable Long id,
            Principal principal,
            HttpServletRequest request) {
        
        try {
            return systemLogService.getLogById(id)
                .map(log -> {
                    // Log the access
                    String clientIp = getClientIpAddress(request);
                    systemLogService.createLog(
                        SystemLog.LogLevel.INFO, 
                        "VIEW_LOG_DETAIL", 
                        principal.getName(), 
                        "Viewed log details for ID: " + id, 
                        SystemLog.LogModule.SYSTEM, 
                        clientIp
                    );
                    return ResponseEntity.ok(log);
                })
                .orElse(ResponseEntity.notFound().build());
                
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(null);
        }
    }
    
    /**
     * Get available log levels and modules for filtering
     */
    @GetMapping("/filters")
    public ResponseEntity<Map<String, Object>> getAvailableFilters() {
        Map<String, Object> filters = new HashMap<>();
        filters.put("levels", SystemLog.LogLevel.values());
        filters.put("modules", SystemLog.LogModule.values());
        return ResponseEntity.ok(filters);
    }
    
    /**
     * Helper method to get client IP address
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String clientIp = request.getHeader("X-Forwarded-For");
        if (clientIp == null || clientIp.isEmpty() || "unknown".equalsIgnoreCase(clientIp)) {
            clientIp = request.getHeader("X-Real-IP");
        }
        if (clientIp == null || clientIp.isEmpty() || "unknown".equalsIgnoreCase(clientIp)) {
            clientIp = request.getRemoteAddr();
        }
        return clientIp;
    }
} 