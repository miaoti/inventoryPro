package com.inventory.service;

import com.inventory.entity.User;
import java.util.List;
 
public interface UserService {
    User findByUsername(String username);
    User findByEmail(String email);
    User save(User user);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    
    /**
     * Find all users who have email alerts enabled
     */
    List<User> findUsersWithEmailAlertsEnabled();
    
    /**
     * Find all users who have daily digest enabled
     */
    List<User> findUsersWithDailyDigestEnabled();
    
    /**
     * Find all users by role (e.g., OWNER, ADMIN, USER)
     */
    List<User> findByRole(User.UserRole role);
} 