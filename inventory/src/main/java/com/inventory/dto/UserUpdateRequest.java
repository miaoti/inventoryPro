package com.inventory.dto;

import com.inventory.entity.User;
import lombok.Data;

@Data
public class UserUpdateRequest {
    private String name;
    private String email;
    private User.UserRole role;
    private String password; // Optional - only if changing password
} 