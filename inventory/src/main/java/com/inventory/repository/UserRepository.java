package com.inventory.repository;

import com.inventory.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
 
public interface UserRepository extends JpaRepository<User, Long> {
    User findByUsername(String username);
    User findByEmail(String email);
    
    /**
     * Find all users who have email alerts enabled
     */
    List<User> findByEnableEmailAlertsTrue();
    
    /**
     * Find all users who have daily digest enabled
     */
    List<User> findByEnableDailyDigestTrue();
    
    /**
     * Count users by role
     */
    long countByRole(User.UserRole role);
} 