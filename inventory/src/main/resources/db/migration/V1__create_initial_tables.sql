-- Create users table
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    alert_email VARCHAR(100),
    enable_email_alerts BOOLEAN DEFAULT TRUE,
    enable_daily_digest BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create items table
CREATE TABLE items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(255) UNIQUE,
    description TEXT,
    location VARCHAR(255),
    current_inventory INT NOT NULL DEFAULT 0,
    pendingpo INT NOT NULL DEFAULT 0,
    used_inventory INT NOT NULL DEFAULT 0,
    safety_stock_threshold INT NOT NULL DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create alerts table
CREATE TABLE alerts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_id BIGINT NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    current_inventory INT NOT NULL,
    pendingpo INT NOT NULL,
    used_inventory INT NOT NULL,
    safety_stock_threshold INT NOT NULL,
    resolved BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- Create item_usage table for tracking usage history
CREATE TABLE item_usage (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_id BIGINT NOT NULL,
    barcode VARCHAR(255),
    quantity_used INT NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_name VARCHAR(100),
    notes TEXT,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_alerts_item_resolved ON alerts(item_id, resolved);
CREATE INDEX idx_alerts_created_at ON alerts(created_at);
CREATE INDEX idx_item_usage_item_id ON item_usage(item_id);
CREATE INDEX idx_item_usage_used_at ON item_usage(used_at); 