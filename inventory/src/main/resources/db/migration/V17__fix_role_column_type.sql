-- Fix role column type to be ENUM instead of VARCHAR
-- This migration fixes the schema validation issue where Hibernate expects ENUM but database has VARCHAR

-- First, update any existing data to use proper case (uppercase)  
UPDATE users SET role = 'USER' WHERE role = 'user';
UPDATE users SET role = 'ADMIN' WHERE role = 'admin';
UPDATE users SET role = 'OWNER' WHERE role = 'owner';

-- Now change the column type to ENUM
ALTER TABLE users MODIFY COLUMN role ENUM('OWNER', 'ADMIN', 'USER') NOT NULL DEFAULT 'USER'; 