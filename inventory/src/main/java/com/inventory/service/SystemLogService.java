package com.inventory.service;

import com.inventory.entity.SystemLog;
import com.inventory.repository.SystemLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class SystemLogService {
    
    private static final Logger logger = LoggerFactory.getLogger(SystemLogService.class);
    
    @Autowired
    private SystemLogRepository systemLogRepository;
    
    /**
     * Create a new system log entry
     */
    @Async
    public void createLog(SystemLog.LogLevel level, String action, String username, 
                         String details, SystemLog.LogModule module, String ipAddress) {
        try {
            SystemLog log = new SystemLog(level, action, username, details, module, ipAddress);
            systemLogRepository.save(log);
            logger.debug("System log created: {} - {} by {}", level, action, username);
        } catch (Exception e) {
            logger.error("Failed to create system log", e);
        }
    }
    
    /**
     * Create a new system log entry with user agent
     */
    @Async
    public void createLog(SystemLog.LogLevel level, String action, String username, 
                         String details, SystemLog.LogModule module, String ipAddress, String userAgent) {
        try {
            SystemLog log = new SystemLog(level, action, username, details, module, ipAddress);
            log.setUserAgent(userAgent);
            systemLogRepository.save(log);
            logger.debug("System log created: {} - {} by {}", level, action, username);
        } catch (Exception e) {
            logger.error("Failed to create system log", e);
        }
    }
    
    /**
     * Get all logs with pagination
     */
    public Page<SystemLog> getAllLogs(Pageable pageable) {
        return systemLogRepository.findAll(pageable);
    }
    
    /**
     * Get logs with filters
     */
    public Page<SystemLog> getLogsWithFilters(SystemLog.LogLevel level, SystemLog.LogModule module, 
                                            String username, Pageable pageable) {
        if (level != null && module != null && username != null && !username.isEmpty()) {
            return systemLogRepository.findByLevelAndModuleAndUsernameContainingIgnoreCase(level, module, username, pageable);
        } else if (level != null && module != null) {
            return systemLogRepository.findByLevelAndModule(level, module, pageable);
        } else if (level != null && username != null && !username.isEmpty()) {
            return systemLogRepository.findByLevelAndUsernameContainingIgnoreCase(level, username, pageable);
        } else if (module != null && username != null && !username.isEmpty()) {
            return systemLogRepository.findByModuleAndUsernameContainingIgnoreCase(module, username, pageable);
        } else if (level != null) {
            return systemLogRepository.findByLevel(level, pageable);
        } else if (module != null) {
            return systemLogRepository.findByModule(module, pageable);
        } else if (username != null && !username.isEmpty()) {
            return systemLogRepository.findByUsernameContainingIgnoreCase(username, pageable);
        } else {
            return systemLogRepository.findAll(pageable);
        }
    }
    
    /**
     * Get logs by date range
     */
    public Page<SystemLog> getLogsByDateRange(LocalDateTime start, LocalDateTime end, Pageable pageable) {
        return systemLogRepository.findByTimestampBetween(start, end, pageable);
    }
    
    /**
     * Get recent logs (last 24 hours)
     */
    public List<SystemLog> getRecentLogs() {
        LocalDateTime since = LocalDateTime.now().minusDays(1);
        return systemLogRepository.findRecentLogs(since);
    }
    
    /**
     * Delete logs by IDs (Owner only)
     */
    public int deleteLogsByIds(List<Long> ids) {
        return systemLogRepository.deleteLogsByIds(ids);
    }
    
    /**
     * Delete logs older than specified days (Owner only)
     */
    public int deleteLogsOlderThan(int days) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(days);
        return systemLogRepository.deleteLogsOlderThan(cutoffDate);
    }
    
    /**
     * Get log statistics
     */
    public LogStatistics getLogStatistics() {
        LogStatistics stats = new LogStatistics();
        stats.setTotalLogs(systemLogRepository.count());
        stats.setErrorLogs(systemLogRepository.countByLevel(SystemLog.LogLevel.ERROR));
        stats.setWarnLogs(systemLogRepository.countByLevel(SystemLog.LogLevel.WARN));
        stats.setInfoLogs(systemLogRepository.countByLevel(SystemLog.LogLevel.INFO));
        stats.setDebugLogs(systemLogRepository.countByLevel(SystemLog.LogLevel.DEBUG));
        
        // Module counts
        stats.setAuthLogs(systemLogRepository.countByModule(SystemLog.LogModule.AUTH));
        stats.setInventoryLogs(systemLogRepository.countByModule(SystemLog.LogModule.INVENTORY));
        stats.setPurchaseLogs(systemLogRepository.countByModule(SystemLog.LogModule.PURCHASE));
        stats.setUserLogs(systemLogRepository.countByModule(SystemLog.LogModule.USER));
        stats.setSystemLogs(systemLogRepository.countByModule(SystemLog.LogModule.SYSTEM));
        
        return stats;
    }
    
    /**
     * Get a specific log by ID
     */
    public Optional<SystemLog> getLogById(Long id) {
        return systemLogRepository.findById(id);
    }
    
    // Convenience methods for common log types
    public void logUserLogin(String username, String ipAddress, String userAgent) {
        createLog(SystemLog.LogLevel.INFO, "USER_LOGIN", username, 
                 "User logged in successfully", SystemLog.LogModule.AUTH, ipAddress, userAgent);
    }
    
    public void logUserLogout(String username, String ipAddress) {
        createLog(SystemLog.LogLevel.INFO, "USER_LOGOUT", username, 
                 "User logged out", SystemLog.LogModule.AUTH, ipAddress);
    }
    
    public void logItemCreated(String username, String itemName, String ipAddress) {
        createLog(SystemLog.LogLevel.INFO, "ITEM_CREATED", username, 
                 "Created item: " + itemName, SystemLog.LogModule.INVENTORY, ipAddress);
    }
    
    public void logItemUpdated(String username, String itemName, String ipAddress) {
        createLog(SystemLog.LogLevel.INFO, "ITEM_UPDATED", username, 
                 "Updated item: " + itemName, SystemLog.LogModule.INVENTORY, ipAddress);
    }
    
    public void logItemDeleted(String username, String itemName, String ipAddress) {
        createLog(SystemLog.LogLevel.WARN, "ITEM_DELETED", username, 
                 "Deleted item: " + itemName, SystemLog.LogModule.INVENTORY, ipAddress);
    }
    
    public void logUserCreated(String username, String createdUser, String ipAddress) {
        createLog(SystemLog.LogLevel.INFO, "USER_CREATED", username, 
                 "Created user: " + createdUser, SystemLog.LogModule.USER, ipAddress);
    }
    
    public void logBulkImport(String username, int itemCount, String ipAddress) {
        createLog(SystemLog.LogLevel.INFO, "BULK_IMPORT", username, 
                 "Imported " + itemCount + " items from CSV", SystemLog.LogModule.INVENTORY, ipAddress);
    }
    
    public void logPurchaseOrderCreated(String username, String itemName, String ipAddress) {
        createLog(SystemLog.LogLevel.INFO, "PO_CREATED", username, 
                 "Created purchase order for: " + itemName, SystemLog.LogModule.PURCHASE, ipAddress);
    }
    
    public void logSystemError(String action, String errorMessage, String ipAddress) {
        createLog(SystemLog.LogLevel.ERROR, "SYSTEM_ERROR", "system", 
                 "Error in " + action + ": " + errorMessage, SystemLog.LogModule.SYSTEM, ipAddress);
    }
    
    /**
     * Inner class for log statistics
     */
    public static class LogStatistics {
        private long totalLogs;
        private long errorLogs;
        private long warnLogs;
        private long infoLogs;
        private long debugLogs;
        private long authLogs;
        private long inventoryLogs;
        private long purchaseLogs;
        private long userLogs;
        private long systemLogs;
        
        // Getters and setters
        public long getTotalLogs() { return totalLogs; }
        public void setTotalLogs(long totalLogs) { this.totalLogs = totalLogs; }
        
        public long getErrorLogs() { return errorLogs; }
        public void setErrorLogs(long errorLogs) { this.errorLogs = errorLogs; }
        
        public long getWarnLogs() { return warnLogs; }
        public void setWarnLogs(long warnLogs) { this.warnLogs = warnLogs; }
        
        public long getInfoLogs() { return infoLogs; }
        public void setInfoLogs(long infoLogs) { this.infoLogs = infoLogs; }
        
        public long getDebugLogs() { return debugLogs; }
        public void setDebugLogs(long debugLogs) { this.debugLogs = debugLogs; }
        
        public long getAuthLogs() { return authLogs; }
        public void setAuthLogs(long authLogs) { this.authLogs = authLogs; }
        
        public long getInventoryLogs() { return inventoryLogs; }
        public void setInventoryLogs(long inventoryLogs) { this.inventoryLogs = inventoryLogs; }
        
        public long getPurchaseLogs() { return purchaseLogs; }
        public void setPurchaseLogs(long purchaseLogs) { this.purchaseLogs = purchaseLogs; }
        
        public long getUserLogs() { return userLogs; }
        public void setUserLogs(long userLogs) { this.userLogs = userLogs; }
        
        public long getSystemLogs() { return systemLogs; }
        public void setSystemLogs(long systemLogs) { this.systemLogs = systemLogs; }
    }
} 