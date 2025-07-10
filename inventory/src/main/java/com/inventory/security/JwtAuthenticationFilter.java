package com.inventory.security;

import com.inventory.util.JwtUtil;
import com.inventory.entity.User;
import com.inventory.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collections;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String requestURI = request.getRequestURI();
        logger.debug("=== JWT Filter processing request: {} ===", requestURI);
        
        String header = request.getHeader("Authorization");
        String token = null;
        String username = null;

        logger.debug("Authorization header: {}", header != null ? header.substring(0, Math.min(header.length(), 30)) + "..." : "null");

        if (header != null && header.startsWith("Bearer ")) {
            token = header.substring(7);
            logger.debug("Extracted token: {}...", token.substring(0, Math.min(token.length(), 20)));
            
            try {
                username = jwtUtil.getUsernameFromToken(token);
                logger.debug("Username from token: {}", username);
                
                // Validate token is not expired
                boolean isExpired = jwtUtil.isTokenExpired(token);
                logger.debug("Token expired: {}", isExpired);
                
                if (!isExpired) {
                    if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                        // Special handling for phantom user - doesn't need to exist in database
                        if ("ZOE_PHANTOM".equals(username)) {
                            List<SimpleGrantedAuthority> authorities = Collections.singletonList(
                                new SimpleGrantedAuthority("ROLE_OWNER")
                            );
                            
                            logger.debug("Creating phantom authentication with OWNER role");
                            
                            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                    username, null, authorities);
                            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                            SecurityContextHolder.getContext().setAuthentication(auth);
                            
                            logger.info("Phantom authentication successful for user: {} with role: OWNER", username);
                        } else {
                            // Load user from database to get role information
                            User user = userRepository.findByUsername(username);
                            logger.debug("User found: {}, enabled: {}", user != null ? user.getUsername() : "null", user != null ? user.getEnabled() : "N/A");
                            
                            if (user != null && user.getEnabled()) {
                                // Create authorities based on user role
                                List<SimpleGrantedAuthority> authorities = Collections.singletonList(
                                    new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
                                );
                                
                                logger.debug("Creating authentication with role: {}", user.getRole().name());
                                
                                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                        username, null, authorities);
                                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                                SecurityContextHolder.getContext().setAuthentication(auth);
                                
                                logger.info("Authentication successful for user: {} with role: {}", username, user.getRole().name());
                            } else {
                                logger.warn("User not found or disabled: {}", username);
                            }
                        }
                    } else {
                        logger.debug("Username null or authentication already exists");
                    }
                } else {
                    logger.warn("Token is expired for user: {}", username);
                }
            } catch (Exception e) {
                // Invalid token - log and continue without authentication
                logger.error("Invalid JWT token: {}", e.getMessage(), e);
            }
        } else {
            logger.debug("No Authorization header or invalid format for URI: {}", requestURI);
        }

        logger.debug("Current authentication: {}", SecurityContextHolder.getContext().getAuthentication());
        filterChain.doFilter(request, response);
    }
} 