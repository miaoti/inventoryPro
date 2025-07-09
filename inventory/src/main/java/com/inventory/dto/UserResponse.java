package com.inventory.dto;

import com.inventory.entity.User;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserResponse {
    private Long id;
    private String username;
    private String name;
    private String email;
    private String alertEmail;
    private User.UserRole role;
    private String department;
    private Integer warningThreshold;
    private Integer criticalThreshold;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 