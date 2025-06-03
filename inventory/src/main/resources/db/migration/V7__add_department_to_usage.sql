-- Migration to add department field to item_usage table
ALTER TABLE item_usage ADD COLUMN department VARCHAR(50); 