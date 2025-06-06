package com.inventory.dto;

import lombok.Data;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

@Data
public class ProfileUpdateRequest {
    
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;
    
    @Email(message = "Email should be valid")
    private String email;
    
    @Email(message = "Alert email should be valid")
    private String alertEmail;
    
    private Boolean enableEmailAlerts;
    
    private Boolean enableDailyDigest;
    
    @Size(min = 6, message = "Password must be at least 6 characters long")
    private String currentPassword; // Required when changing password
    
    @Size(min = 6, message = "New password must be at least 6 characters long")
    private String newPassword; // Optional - only if changing password
} 