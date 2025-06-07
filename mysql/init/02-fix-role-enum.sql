-- Fix role column type to be ENUM instead of VARCHAR  
USE inventory_db;

-- First, update any existing data to use proper case (uppercase)
UPDATE users SET role = 'USER' WHERE role = 'user' OR role = 'USER';
UPDATE users SET role = 'ADMIN' WHERE role = 'admin' OR role = 'ADMIN';  
UPDATE users SET role = 'OWNER' WHERE role = 'owner' OR role = 'OWNER';

-- Check if the role column exists and fix it
ALTER TABLE users MODIFY COLUMN role ENUM('OWNER', 'ADMIN', 'USER') NOT NULL DEFAULT 'USER';

-- Ensure we have proper indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email); 