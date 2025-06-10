-- Migration to create owner user account
-- Username: zoe
-- Email: zhongqi0728@gmail.com
-- Password: [pre-hashed password provided]
INSERT INTO users (username, password, email, full_name, enabled, role, enable_email_alerts, enable_daily_digest, alert_email, created_at, updated_at) 
VALUES ('zoe', '$2a$12$2x2e3UQT/Zisuh0uNs6jVOVQdnBl0DrpUxvAvpTcglwD.iCItAqmi', 'zhongqi0728@gmail.com', 'Zoe (Owner)', TRUE, 'OWNER', TRUE, TRUE, 'zhongqi0728@gmail.com', NOW(), NOW())
ON DUPLICATE KEY UPDATE username = username; 