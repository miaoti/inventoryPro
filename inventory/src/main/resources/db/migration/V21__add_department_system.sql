-- Add department-based access control system
-- V21: Add department fields to users and items tables

-- Add department to users table
ALTER TABLE users ADD COLUMN department VARCHAR(100) DEFAULT 'General';

-- Add department to items table  
-- NULL or empty department means the item is PUBLIC (viewable by all)
ALTER TABLE items ADD COLUMN department VARCHAR(100) DEFAULT NULL;

-- Update existing users to have a department
-- Keep owner/admin roles but give them departments for testing
UPDATE users SET department = 'Administration' WHERE role = 'OWNER';
UPDATE users SET department = 'Administration' WHERE role = 'ADMIN';
UPDATE users SET department = 'General' WHERE role = 'USER';

-- Create index for performance on department filtering
CREATE INDEX idx_items_department ON items(department);
CREATE INDEX idx_users_department ON users(department);

-- Add comments for clarity
ALTER TABLE users MODIFY COLUMN department VARCHAR(100) DEFAULT 'General' 
COMMENT 'Department the user belongs to. Used for access control.';

ALTER TABLE items MODIFY COLUMN department VARCHAR(100) DEFAULT NULL 
COMMENT 'Department that owns this item. NULL/empty means PUBLIC (accessible by all departments).'; 