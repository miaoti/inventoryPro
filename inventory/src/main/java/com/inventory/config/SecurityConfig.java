package com.inventory.config;

import com.inventory.security.JwtAuthenticationFilter;
import com.inventory.service.CustomUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.core.userdetails.UserDetailsService;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10); // Using strength 10 for consistency
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configure(http)) // Modern CORS configuration
            .csrf(csrf -> csrf.disable()) // Modern CSRF disable
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(authz -> authz
                .requestMatchers(
                    new AntPathRequestMatcher("/auth/**"),
                    new AntPathRequestMatcher("/api/auth/**"),
                    new AntPathRequestMatcher("/contact/**"),
                    new AntPathRequestMatcher("/api/contact/**"),
                    new AntPathRequestMatcher("/items/**"),
                    new AntPathRequestMatcher("/alerts/**"),
                    new AntPathRequestMatcher("/usage/**"),
                    new AntPathRequestMatcher("/public/**"),
                    new AntPathRequestMatcher("/actuator/health")
                ).permitAll()
                .requestMatchers(
                    new AntPathRequestMatcher("/user/**"),
                    new AntPathRequestMatcher("/api/user/**"),
                    new AntPathRequestMatcher("/stats/**")
                ).authenticated()
                .anyRequest().authenticated()
            )
            .userDetailsService(customUserDetailsService)
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .headers(headers -> headers
                .frameOptions(frameOptions -> frameOptions.disable())
            );
        return http.build();
    }
} 