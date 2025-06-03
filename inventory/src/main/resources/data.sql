DROP DATABASE inventory_db;
CREATE DATABASE inventory_db;

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password, email, full_name, role, enabled)
VALUES ('admin', '$2a$12$9soUw3m3p6Y7fmjrSxNNOOo3EFqkII9icaBS.aobKKq.CvGGg229K', 'admin@example.com', 'Admin User', 'ADMIN', true)
ON DUPLICATE KEY UPDATE username = username;

-- Insert sample items
INSERT INTO items (code, name, description, current_inventory, pending_po, used_inventory, safety_stock_threshold, barcode, created_at, updated_at)
VALUES 
('ITEM001', 'Laptop', 'Dell XPS 13', 10, 5, 2, 5, '123456789012', NOW(), NOW()),
('ITEM002', 'Monitor', '27-inch 4K Display', 15, 0, 3, 8, '234567890123', NOW(), NOW()),
('ITEM003', 'Keyboard', 'Mechanical RGB', 20, 10, 5, 10, '345678901234', NOW(), NOW())
ON DUPLICATE KEY UPDATE code = code; 