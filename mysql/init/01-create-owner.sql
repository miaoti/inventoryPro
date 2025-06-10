-- Create owner account for the application
-- This script runs automatically when the database is initialized

USE inventory;

-- Insert the owner user with correct schema and email alert settings
INSERT IGNORE INTO users (id, username, email, full_name, password, role, enabled, created_at, updated_at, enable_email_alerts, enable_daily_digest, alert_email) 
VALUES (1, 'zoe', 'zhongqi0728@gmail.com', 'Zoe Admin', '$2a$12$VCOmYI4XwytlMGHWyvrh/u80KxX70jVkV4AMdcAqVfnlenmcx69OO', 'OWNER', true, NOW(), NOW(), TRUE, TRUE, 'zhongqi0728@gmail.com');

-- Insert the OWNER role assignment (for compatibility if user_roles table is used)
INSERT IGNORE INTO user_roles (user_id, role)
VALUES (1, 'OWNER');

-- Create the profile for the owner
INSERT IGNORE INTO user_profiles (user_id, first_name, last_name, created_at, updated_at)
VALUES (1, 'Zoe', 'Admin', NOW(), NOW()); 