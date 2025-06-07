-- Fix database schema to match JPA entity expectations
-- This script runs before other initialization scripts

USE inventory;

-- Check if users table exists and fix the role column type
SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables 
                    WHERE table_schema = 'inventory' AND table_name = 'users');

-- Only proceed if users table exists
SET @sql = IF(@table_exists > 0,
    'ALTER TABLE users MODIFY COLUMN role ENUM(''OWNER'', ''ADMIN'', ''USER'') NOT NULL',
    'SELECT "Users table does not exist yet, skipping schema fix" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create users table if it doesn't exist (backup in case)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('OWNER', 'ADMIN', 'USER') NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    alert_email VARCHAR(255),
    enable_email_alerts BOOLEAN DEFAULT TRUE,
    enable_daily_digest BOOLEAN DEFAULT FALSE
);

-- Create user_roles table if referenced elsewhere
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL,
    role ENUM('OWNER', 'ADMIN', 'USER') NOT NULL,
    PRIMARY KEY (user_id, role),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id BIGINT PRIMARY KEY,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
); 