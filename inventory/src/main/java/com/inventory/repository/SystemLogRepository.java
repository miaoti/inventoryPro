package com.inventory.repository;

import com.inventory.entity.SystemLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SystemLogRepository extends JpaRepository<SystemLog, Long> {
    
    // Find logs by level
    Page<SystemLog> findByLevel(SystemLog.LogLevel level, Pageable pageable);
    
    // Find logs by module
    Page<SystemLog> findByModule(SystemLog.LogModule module, Pageable pageable);
    
    // Find logs by username
    Page<SystemLog> findByUsernameContainingIgnoreCase(String username, Pageable pageable);
    
    // Find logs by level and module
    Page<SystemLog> findByLevelAndModule(SystemLog.LogLevel level, SystemLog.LogModule module, Pageable pageable);
    
    // Find logs by level and username
    Page<SystemLog> findByLevelAndUsernameContainingIgnoreCase(SystemLog.LogLevel level, String username, Pageable pageable);
    
    // Find logs by module and username
    Page<SystemLog> findByModuleAndUsernameContainingIgnoreCase(SystemLog.LogModule module, String username, Pageable pageable);
    
    // Find logs by all filters
    Page<SystemLog> findByLevelAndModuleAndUsernameContainingIgnoreCase(
        SystemLog.LogLevel level, SystemLog.LogModule module, String username, Pageable pageable);
    
    // Find logs by date range
    Page<SystemLog> findByTimestampBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);
    
    // Find logs older than a specific date
    @Query("SELECT sl FROM SystemLog sl WHERE sl.timestamp < :cutoffDate")
    List<SystemLog> findLogsOlderThan(@Param("cutoffDate") LocalDateTime cutoffDate);
    
    // Delete logs older than a specific date
    @Modifying
    @Transactional
    @Query("DELETE FROM SystemLog sl WHERE sl.timestamp < :cutoffDate")
    int deleteLogsOlderThan(@Param("cutoffDate") LocalDateTime cutoffDate);
    
    // Delete logs by IDs
    @Modifying
    @Transactional
    @Query("DELETE FROM SystemLog sl WHERE sl.id IN :ids")
    int deleteLogsByIds(@Param("ids") List<Long> ids);
    
    // Count logs by level
    long countByLevel(SystemLog.LogLevel level);
    
    // Count logs by module
    long countByModule(SystemLog.LogModule module);
    
    // Get recent logs (last 24 hours)
    @Query("SELECT sl FROM SystemLog sl WHERE sl.timestamp >= :since ORDER BY sl.timestamp DESC")
    List<SystemLog> findRecentLogs(@Param("since") LocalDateTime since);
} 