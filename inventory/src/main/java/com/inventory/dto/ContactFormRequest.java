package com.inventory.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContactFormRequest {
    private String name;
    private String email;
    private String company;
    private String phone;
    private String message;
    private String subject;
} 