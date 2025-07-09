package com.inventory.repository;

import com.inventory.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
    
    /**
     * Find department by name
     */
    Optional<Department> findByName(String name);
    
    /**
     * Check if department exists by name
     */
    boolean existsByName(String name);
    
    /**
     * Get all department names ordered alphabetically
     */
    @Query("SELECT d.name FROM Department d ORDER BY d.name")
    List<String> findAllDepartmentNames();
    
    /**
     * Delete department by name
     */
    void deleteByName(String name);
} 