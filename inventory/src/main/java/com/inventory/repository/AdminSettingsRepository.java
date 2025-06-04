package com.inventory.repository;

import com.inventory.entity.AdminSettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AdminSettingsRepository extends JpaRepository<AdminSettings, Long> {
    Optional<AdminSettings> findBySettingKey(String settingKey);
} 