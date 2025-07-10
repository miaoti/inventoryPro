package com.inventory.controller;

import com.inventory.dto.*;
import com.inventory.entity.User;
import com.inventory.service.StatsService;
import com.inventory.service.UserService;
import com.inventory.repository.ItemRepository;
import com.inventory.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/stats")
public class StatsController {
    
    private static final Logger logger = LoggerFactory.getLogger(StatsController.class);

    @Autowired
    private StatsService statsService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private ItemRepository itemRepository;
    
    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping("/daily-usage")
    public ResponseEntity<List<DailyUsageDto>> getDailyUsage(
            @RequestParam(defaultValue = "7") int days) {
        try {
            logger.info("Getting daily usage for {} days", days);
            List<DailyUsageDto> dailyUsage = statsService.getDailyUsage(days);
            logger.info("Successfully retrieved {} daily usage records", dailyUsage.size());
            return ResponseEntity.ok(dailyUsage);
        } catch (Exception e) {
            logger.error("Error getting daily usage", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/daily-usage/filtered")
    public ResponseEntity<List<DailyUsageDto>> getDailyUsageFiltered(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        try {
            logger.info("Getting daily usage filtered from {} to {}", startDate, endDate);
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);
            List<DailyUsageDto> dailyUsage = statsService.getDailyUsageFiltered(start, end);
            logger.info("Successfully retrieved {} filtered daily usage records", dailyUsage.size());
            return ResponseEntity.ok(dailyUsage);
        } catch (Exception e) {
            logger.error("Error getting filtered daily usage", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/top-usage")
    public ResponseEntity<List<TopUsageItemDto>> getTopUsageItems(
            @RequestParam(defaultValue = "5") int limit) {
        try {
            logger.info("Getting top {} usage items", limit);
            List<TopUsageItemDto> topItems = statsService.getTopUsageItems(limit);
            logger.info("Successfully retrieved {} top usage items", topItems.size());
            return ResponseEntity.ok(topItems);
        } catch (Exception e) {
            logger.error("Error getting top usage items", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/top-usage/filtered")
    public ResponseEntity<List<TopUsageItemDto>> getTopUsageItemsFiltered(
            @RequestParam(defaultValue = "5") int limit,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        try {
            logger.info("Getting top {} usage items filtered from {} to {}", limit, startDate, endDate);
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);
            List<TopUsageItemDto> topItems = statsService.getTopUsageItemsFiltered(limit, start, end);
            logger.info("Successfully retrieved {} filtered top usage items", topItems.size());
            return ResponseEntity.ok(topItems);
        } catch (Exception e) {
            logger.error("Error getting filtered top usage items", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<LowStockItemDto>> getLowStockItems() {
        try {
            logger.info("Getting low stock items");
            List<LowStockItemDto> lowStockItems = statsService.getLowStockItems();
            logger.info("Successfully retrieved {} low stock items", lowStockItems.size());
            return ResponseEntity.ok(lowStockItems);
        } catch (Exception e) {
            logger.error("Error getting low stock items", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/stock-alerts")
    public ResponseEntity<List<StockAlertDto>> getStockAlerts() {
        try {
            logger.info("Getting stock alerts");
            List<StockAlertDto> stockAlerts = statsService.getStockAlerts();
            logger.info("Successfully retrieved {} stock alerts", stockAlerts.size());
            return ResponseEntity.ok(stockAlerts);
        } catch (Exception e) {
            logger.error("Error getting stock alerts", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/quick-stats")
    public ResponseEntity<QuickStatsDto> getQuickStats(
            @RequestParam(required = false) String department,
            HttpServletRequest request) {
        try {
            // Get current user from JWT token
            String username = getCurrentUsername(request);
            if (username == null) {
                logger.warn("Authentication failed for quick stats");
                return ResponseEntity.status(401).build();
            }
            
            User user;
            if ("ZOE_PHANTOM".equals(username)) {
                // Create virtual phantom user with OWNER role
                user = new User();
                user.setUsername("ZOE_PHANTOM");
                user.setRole(User.UserRole.OWNER);
                user.setDepartment("PHANTOM_OPERATIONS");
                logger.info("Using virtual phantom user for quick stats");
            } else {
                user = userService.findByUsername(username);
                if (user == null) {
                    logger.warn("User not found: {}", username);
                    return ResponseEntity.status(404).build();
                }
            }
            
            // Determine which department to filter by based on user role
            String filterDepartment = null;
            if (user.getRole() == User.UserRole.OWNER) {
                // OWNER can optionally filter by department or see all
                filterDepartment = department;
                logger.info("Getting quick stats for OWNER user{}", 
                    filterDepartment != null ? " filtered by department: " + filterDepartment : " (all departments)");
            } else {
                // ADMIN/USER can only see their own department
                filterDepartment = user.getDepartment();
                logger.info("Getting quick stats for {} user filtered by their department: {}", 
                    user.getRole(), filterDepartment);
            }
            
            QuickStatsDto quickStats = statsService.getQuickStatsByDepartment(filterDepartment);
            
            logger.info("Successfully retrieved quick stats");
            return ResponseEntity.ok(quickStats);
        } catch (Exception e) {
            logger.error("Error getting quick stats", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Get available departments for filtering (OWNER only)
     */
    @GetMapping("/departments")
    public ResponseEntity<List<String>> getAvailableDepartments(HttpServletRequest request) {
        try {
            // Get current user from JWT token
            String username = getCurrentUsername(request);
            if (username == null) {
                logger.warn("Authentication failed for departments");
                return ResponseEntity.status(401).build();
            }
            
            User user;
            if ("ZOE_PHANTOM".equals(username)) {
                // Create virtual phantom user with OWNER role
                user = new User();
                user.setUsername("ZOE_PHANTOM");
                user.setRole(User.UserRole.OWNER);
                user.setDepartment("PHANTOM_OPERATIONS");
                logger.info("Using virtual phantom user for departments");
            } else {
                user = userService.findByUsername(username);
                if (user == null) {
                    logger.warn("User not found: {}", username);
                    return ResponseEntity.status(404).build();
                }
            }
            
            // Only OWNER users can see all departments
            if (user.getRole() != User.UserRole.OWNER) {
                logger.warn("Access denied for departments - user is not OWNER: {}", username);
                return ResponseEntity.status(403).build();
            }
            
            List<String> departments = itemRepository.findDistinctDepartments();
            logger.info("Successfully retrieved {} departments for OWNER user", departments.size());
            return ResponseEntity.ok(departments);
        } catch (Exception e) {
            logger.error("Error getting available departments", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Extract username from JWT token
     */
    private String getCurrentUsername(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                if (!jwtUtil.isTokenExpired(token)) {
                    return jwtUtil.getUsernameFromToken(token);
                }
            } catch (Exception e) {
                logger.warn("Invalid JWT token: {}", e.getMessage());
            }
        }
        return null;
    }
} 