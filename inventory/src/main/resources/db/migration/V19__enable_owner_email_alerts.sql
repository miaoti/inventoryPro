-- Migration to ensure OWNER users have email alerts enabled
-- This ensures OWNER users receive email notifications for system alerts

-- Enable email alerts for all OWNER users
UPDATE users 
SET enable_email_alerts = TRUE, 
    enable_daily_digest = TRUE,
    alert_email = COALESCE(alert_email, email)
WHERE role = 'OWNER'; 