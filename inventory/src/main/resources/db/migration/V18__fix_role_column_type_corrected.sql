-- Fix role column type to be ENUM instead of VARCHAR (Corrected Version)
-- This migration fixes the schema validation issue where Hibernate expects ENUM but database has VARCHAR
-- V17 failed due to MySQL syntax error, this is the corrected version

-- First, update any existing data to use proper case (uppercase)
UPDATE users SET role = 'USER' WHERE role = 'user' OR role LIKE '%user%';
UPDATE users SET role = 'ADMIN' WHERE role = 'admin' OR role LIKE '%admin%';
UPDATE users SET role = 'OWNER' WHERE role = 'owner' OR role LIKE '%owner%';

-- Now change the column type to ENUM (this is the critical fix)
ALTER TABLE users MODIFY COLUMN role ENUM('OWNER', 'ADMIN', 'USER') NOT NULL DEFAULT 'USER'; 