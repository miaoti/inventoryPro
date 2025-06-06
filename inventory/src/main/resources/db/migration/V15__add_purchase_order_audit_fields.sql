-- Add created_by and arrived_by columns to purchase_orders table
ALTER TABLE purchase_orders 
ADD COLUMN created_by VARCHAR(255) NULL,
ADD COLUMN arrived_by VARCHAR(255) NULL; 