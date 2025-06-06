-- Create owner account for the application
-- This script runs automatically when the database is initialized

USE inventory;

-- Insert the owner user
INSERT IGNORE INTO users (id, username, email, password, enabled, created_at, updated_at) 
VALUES (1, 'zoe', 'zhongqi0728@gmail.com', '$2a$12$VCOmYI4XwytlMGHWyvrh/u80KxX70jVkV4AMdcAqVfnlenmcx69OO', true, NOW(), NOW());

-- Insert the OWNER role assignment
INSERT IGNORE INTO user_roles (user_id, role)
VALUES (1, 'OWNER');

-- Create the profile for the owner
INSERT IGNORE INTO user_profiles (user_id, first_name, last_name, created_at, updated_at)
VALUES (1, 'Zoe', 'Admin', NOW(), NOW()); 