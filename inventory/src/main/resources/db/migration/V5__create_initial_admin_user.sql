-- Migration to create initial admin user
-- Default password: admin123 (should be changed after first login)
INSERT INTO users (username, password, email, full_name, enabled, role, enable_email_alerts, enable_daily_digest, alert_email) 
VALUES ('admin', '$2a$12$D7sfu5xhPPJ6PiYceLu9eegHTmZdGXsGJCEb4MGwIErmr0R2oB6l2', 'admin@company.com', 'System Administrator', TRUE, 'ADMIN', TRUE, TRUE, 'admin@company.com'); 