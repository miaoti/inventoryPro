-- Migration to add read status to alerts table
ALTER TABLE alerts ADD COLUMN `read` BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE alerts ADD COLUMN read_at TIMESTAMP NULL; 