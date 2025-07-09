package com.inventory.dto;

import com.inventory.entity.User;
import lombok.Data;

@Data
public class UserUpdateRequest {
    private String name;
    private String email;
    private String alertEmail;
    private User.UserRole role;
    private String department;
    private Integer warningThreshold;
    private Integer criticalThreshold;
    private String password; // Optional - only if changing password
} 