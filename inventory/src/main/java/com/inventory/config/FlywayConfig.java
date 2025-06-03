package com.inventory.config;

import org.flywaydb.core.Flyway;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationInitializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;

import javax.sql.DataSource;

@Configuration
public class FlywayConfig {

    @Bean
    public FlywayMigrationInitializer flywayInitializer(DataSource dataSource) {
        return new FlywayMigrationInitializer(createFlyway(dataSource), null);
    }

    private Flyway createFlyway(DataSource dataSource) {
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .baselineOnMigrate(true)
                .validateOnMigrate(false)
                .cleanDisabled(false)
                .load();
        
        try {
            // First, try to repair any failed migrations
            flyway.repair();
            System.out.println("✅ Successfully repaired failed migrations");
        } catch (Exception repairException) {
            try {
                // If repair fails, clean the database and start fresh
                System.out.println("⚠️ Repair failed, cleaning database for fresh start...");
                flyway.clean();
                System.out.println("✅ Database cleaned successfully");
            } catch (Exception cleanException) {
                System.err.println("❌ Failed to clean database: " + cleanException.getMessage());
                throw new RuntimeException("Unable to initialize database", cleanException);
            }
        }
        
        return flyway;
    }
} 