-- Migration to update admin user password to correct hash
-- Password: admin123
UPDATE users 
SET password = '$2a$12$D7sfu5xhPPJ6PiYceLu9eegHTmZdGXsGJCEb4MGwIErmr0R2oB6l2' 
WHERE username = 'admin'; 