package com.inventory.service.impl;

import com.inventory.entity.User;
import com.inventory.repository.UserRepository;
import com.inventory.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public User findByUsername(String username) {
        return userRepository.findByUsername(username);
    }
    
    @Override
    public User findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    @Override
    public User save(User user) {
        return userRepository.save(user);
    }
    
    @Override
    public boolean existsByUsername(String username) {
        return userRepository.findByUsername(username) != null;
    }
    
    @Override
    public boolean existsByEmail(String email) {
        return userRepository.findByEmail(email) != null;
    }
    
    @Override
    public List<User> findUsersWithEmailAlertsEnabled() {
        return userRepository.findByEnableEmailAlertsTrue();
    }
    
    @Override
    public List<User> findUsersWithDailyDigestEnabled() {
        return userRepository.findByEnableDailyDigestTrue();
    }
} 