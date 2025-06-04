-- Create admin_settings table for storing configuration options
CREATE TABLE admin_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(255) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default item display fields setting
INSERT INTO admin_settings (setting_key, setting_value, description) 
VALUES ('item_display_fields', 'name,code,location,currentInventory,category,equipment', 
'Fields to display in Record Item Usage page when an item is scanned'); 