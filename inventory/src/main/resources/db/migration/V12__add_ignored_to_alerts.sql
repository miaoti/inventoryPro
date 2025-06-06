-- Add ignored columns to alerts table
ALTER TABLE alerts 
ADD COLUMN ignored BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN ignored_at TIMESTAMP NULL; 