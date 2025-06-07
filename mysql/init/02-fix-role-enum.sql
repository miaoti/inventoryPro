-- Fix role column type to be ENUM instead of VARCHAR
USE inventory_db;

-- Check if the role column exists and fix it
ALTER TABLE users MODIFY COLUMN role ENUM('owner', 'admin', 'user') NOT NULL DEFAULT 'user';

-- Ensure we have proper indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email); 