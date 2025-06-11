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
        logger.info("=== LOGIN ATTEMPT START ===");
        logger.info("Username: {}", loginRequest.getUsername());
        logger.info("SessionId: {}", loginRequest.getSessionId());
        logger.info("Password length: {}", loginRequest.getPassword() != null ? loginRequest.getPassword().length() : "null");
        logger.info("Password (first 5 chars): {}", loginRequest.getPassword() != null && loginRequest.getPassword().length() > 5 
            ? loginRequest.getPassword().substring(0, 5) + "..." : "null or too short");
        
        try {
            // Check for null or empty inputs
            if (loginRequest.getUsername() == null || loginRequest.getUsername().trim().isEmpty()) {
                logger.warn("Login failed: Username is null or empty");
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "Username is required", "debug", "username_empty"));
            }
            
            if (loginRequest.getPassword() == null || loginRequest.getPassword().trim().isEmpty()) {
                logger.warn("Login failed: Password is null or empty");
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "Password is required", "debug", "password_empty"));
            }
            
            // Find user
            logger.info("Searching for user: {}", loginRequest.getUsername());
            User user = userService.findByUsername(loginRequest.getUsername().trim());
        
        if (user == null) {
                logger.warn("LOGIN FAILED: User not found: {}", loginRequest.getUsername());
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "Invalid username or password", "debug", "user_not_found"));
            }
            
            // Log user details
            logger.info("USER FOUND:");
            logger.info("  ID: {}", user.getId());
            logger.info("  Username: {}", user.getUsername());
            logger.info("  Email: {}", user.getEmail());
            logger.info("  Full Name: {}", user.getFullName());
            logger.info("  Role: {}", user.getRole());
            logger.info("  Enabled: {}", user.getEnabled());
            logger.info("  Created At: {}", user.getCreatedAt());
            logger.info("  Password Hash Length: {}", user.getPassword() != null ? user.getPassword().length() : "null");
            logger.info("  Password Hash (first 10 chars): {}", user.getPassword() != null && user.getPassword().length() > 10 
                ? user.getPassword().substring(0, 10) + "..." : "null or too short");
            
            // Check if user is enabled
            if (!user.getEnabled()) {
                logger.warn("LOGIN FAILED: User account is disabled: {}", user.getUsername());
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Account is disabled", "debug", "account_disabled"));
            }
            
            // Verify password
            logger.info("VERIFYING PASSWORD:");
            logger.info("  Input password: {}", loginRequest.getPassword());
            logger.info("  Stored hash: {}", user.getPassword());
            
            // Check if stored password is a valid bcrypt hash
            if (user.getPassword() == null || !user.getPassword().startsWith("$2a$") && !user.getPassword().startsWith("$2b$") && !user.getPassword().startsWith("$2y$")) {
                logger.error("INVALID PASSWORD HASH FORMAT for user {}: {}", user.getUsername(), user.getPassword());
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "Account configuration error", "debug", "invalid_password_hash"));
            }
            
            boolean passwordMatches;
            try {
                passwordMatches = passwordEncoder.matches(loginRequest.getPassword(), user.getPassword());
                logger.info("  Password encoder result: {}", passwordMatches);
            } catch (Exception e) {
                logger.error("PASSWORD ENCODING ERROR for user {}: {}", user.getUsername(), e.getMessage(), e);
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "Authentication error", "debug", "password_encoding_error", "error", e.getMessage()));
            }
        
        if (passwordMatches) {
                logger.info("LOGIN SUCCESS for user: {}", user.getUsername());
                
                // Generate JWT token
                String token;
                try {
                    token = jwtUtil.generateToken(user.getUsername());
                    logger.info("JWT token generated successfully, length: {}", token.length());
                } catch (Exception e) {
                    logger.error("JWT TOKEN GENERATION ERROR for user {}: {}", user.getUsername(), e.getMessage(), e);
                    return ResponseEntity.status(500)
                        .body(Map.of("message", "Token generation failed", "debug", "jwt_error", "error", e.getMessage()));
                }
                
                // Prepare response
                Map<String, Object> response = Map.of(
                    "message", "Login successful",
                    "token", token,
                    "user", Map.of(
                        "id", user.getId(),
                        "username", user.getUsername(),
                        "email", user.getEmail(),
                        "fullName", user.getFullName(),
                        "role", user.getRole()
                    ),
                    "debug", "login_success"
                );
                
                logger.info("=== LOGIN SUCCESS COMPLETE ===");
                return ResponseEntity.ok().body(response);
            } else {
                logger.warn("LOGIN FAILED: Password mismatch for user: {}", user.getUsername());
                logger.warn("  This could indicate:");
                logger.warn("  1. Wrong password provided");
                logger.warn("  2. Password hash corruption");
                logger.warn("  3. Password encoder configuration issue");
                
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "Invalid username or password", "debug", "password_mismatch"));
            }
            
        } catch (Exception e) {
            logger.error("UNEXPECTED LOGIN ERROR for username {}: {}", loginRequest.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(500)
                .body(Map.of(
                    "message", "Login failed due to system error", 
                    "debug", "system_error",
                    "error", e.getMessage()
                ));
        } finally {
            logger.info("=== LOGIN ATTEMPT END ===");
        }
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