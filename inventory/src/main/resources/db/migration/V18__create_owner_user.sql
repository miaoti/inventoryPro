-- Migration to create initial OWNER user
-- OWNER has ultimate system access including log viewing
INSERT INTO users (username, password, email, full_name, enabled, role, enable_email_alerts, enable_daily_digest, alert_email, created_at, updated_at) 
VALUES ('owner', '$2a$12$D7sfu5xhPPJ6PiYceLu9eegHTmZdGXsGJCEb4MGwIErmr0R2oB6l2', 'owner@company.com', 'System Owner', TRUE, 'OWNER', TRUE, TRUE, 'owner@company.com', NOW(), NOW());

-- Also update the existing admin user to ensure they have the latest email configuration
UPDATE users SET 
    enable_email_alerts = TRUE, 
    enable_daily_digest = TRUE,
    updated_at = NOW()
WHERE username = 'admin' AND role = 'ADMIN'; 