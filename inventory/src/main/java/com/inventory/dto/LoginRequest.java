package com.inventory.dto;

import lombok.Data;
 
@Data
public class LoginRequest {
    private String username;
    private String password;
    private String sessionId; // For session tracking
} 