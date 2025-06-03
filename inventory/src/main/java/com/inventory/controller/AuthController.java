package com.inventory.controller;

import com.inventory.dto.LoginRequest;
import com.inventory.dto.RegisterRequest;
import com.inventory.entity.User;
import com.inventory.service.UserService;
import com.inventory.service.EmailService;
import com.inventory.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class AuthController {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private EmailService emailService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        logger.info("Login attempt for username: {}", loginRequest.getUsername());
        
        User user = userService.findByUsername(loginRequest.getUsername());
        
        if (user == null) {
            logger.warn("User not found: {}", loginRequest.getUsername());
            return ResponseEntity.badRequest()
                .body(Map.of("message", "Invalid username or password"));
        }
        
        logger.info("Found user: {}", user.getUsername());
        logger.info("Stored password hash: {}", user.getPassword());
        logger.info("Input password: {}", loginRequest.getPassword());
        
        boolean passwordMatches = passwordEncoder.matches(loginRequest.getPassword(), user.getPassword());
        logger.info("Password matches: {}", passwordMatches);
        
        if (passwordMatches) {
            String token = jwtUtil.generateToken(user.getUsername());
            return ResponseEntity.ok()
                .body(Map.of(
                    "message", "Login successful",
                    "token", token,
                    "user", Map.of(
                        "id", user.getId(),
                        "username", user.getUsername(),
                        "email", user.getEmail(),
                        "fullName", user.getFullName(),
                        "role", user.getRole()
                    )
                ));
        }
        
        return ResponseEntity.badRequest()
            .body(Map.of("message", "Invalid username or password"));
    }
    
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest) {
        logger.info("Registration attempt for username: {}", registerRequest.getUsername());
        
        // Check if username already exists
        if (userService.findByUsername(registerRequest.getUsername()) != null) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "Username already exists"));
        }
        
        try {
            // Create new user
            User newUser = new User();
            newUser.setUsername(registerRequest.getUsername());
            newUser.setEmail(registerRequest.getEmail());
            newUser.setFullName(registerRequest.getFullName());
            newUser.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
            
            // Set role (default to USER if not specified or invalid)
            try {
                newUser.setRole(User.UserRole.valueOf(registerRequest.getRole().toUpperCase()));
            } catch (Exception e) {
                newUser.setRole(User.UserRole.USER);
            }
            
            newUser.setEnabled(true);
            
            // Save user (assuming UserService has a save method)
            User savedUser = userService.save(newUser);
            
            // Send welcome email
            try {
                emailService.sendWelcomeEmail(savedUser.getEmail(), savedUser.getFullName(), null);
            } catch (Exception e) {
                logger.warn("Failed to send welcome email to: {}", savedUser.getEmail(), e);
                // Continue even if email fails
            }
            
            logger.info("User registered successfully: {}", savedUser.getUsername());
            
            return ResponseEntity.ok(Map.of(
                "message", "Registration successful. Welcome to Smart Inventory Pro!",
                "user", Map.of(
                    "id", savedUser.getId(),
                    "username", savedUser.getUsername(),
                    "email", savedUser.getEmail(),
                    "fullName", savedUser.getFullName(),
                    "role", savedUser.getRole()
                )
            ));
            
        } catch (Exception e) {
            logger.error("Registration failed for username: {}", registerRequest.getUsername(), e);
            return ResponseEntity.status(500)
                .body(Map.of("message", "Registration failed. Please try again."));
        }
    }
} 