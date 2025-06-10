# Email Notification Debugging Guide

## Overview
This guide helps debug email notification issues in the inventory management system.

## Changes Made for Debugging

### 1. Backend Email Configuration
- **MailConfig.java**: Added comprehensive mail configuration with debug logging
- **application-production.yml**: Enhanced logging levels for email services
- **EmailServiceImpl.java**: Added detailed logging for email sending attempts

### 2. Alert System Debugging
- **AlertService.java**: Enhanced logging in `sendNotificationToUsers()` method
- Added logging for user lookup and email sending attempts

### 3. Frontend Email Debugging
- **scanner/page.tsx**: Added email configuration debugging when page loads
- **api.ts**: Added `debugAPI` for troubleshooting email configuration

### 4. Debug Endpoints
- **DebugController.java**: New controller with debugging endpoints:
  - `GET /api/debug/email-config`: Check email configuration and user settings
  - `POST /api/debug/test-email/{username}`: Send test email to specific user

### 5. Profile Page Cleanup
- Removed duplicate email settings from profile page
- Email notifications should only be configured in Settings page

## Email Configuration Requirements

### GitHub Secrets Required
- `MAIL_USERNAME`: Gmail account username
- `MAIL_PASSWORD`: Gmail app password (not regular password)

### User Requirements
- Users must have `enable_email_alerts = TRUE` in database
- Default admin user created with email alerts enabled

## Debugging Steps

### 1. Check Email Configuration
Access: `https://129.146.49.129/api/debug/email-config`

Expected Response:
```json
{
  "mailUsername": "your-email@gmail.com",
  "mailPasswordConfigured": true,
  "fallbackEmail": "your-email@gmail.com",
  "usersWithEmailAlertsCount": 1,
  "usersWithEmailAlerts": {
    "admin": {
      "username": "admin",
      "email": "admin@company.com",
      "alertEmail": "admin@company.com",
      "effectiveAlertEmail": "admin@company.com",
      "enableEmailAlerts": true,
      "enableDailyDigest": true
    }
  }
}
```

### 2. Test Email Sending
Access: `POST https://129.146.49.129/api/debug/test-email/admin`

### 3. Check Frontend Logs
1. Open browser console on scanner page
2. Look for "EMAIL CONFIGURATION DEBUG" logs
3. Check "EMAIL NOTIFICATION DEBUG" logs when using items

### 4. Check Backend Logs
1. SSH into server: `ssh -i ssh-key-2025-06-06.key ubuntu@129.146.49.129`
2. Check logs: `docker logs inventory_backend_prod`
3. Look for:
   - "MAIL CONFIGURATION DEBUG" logs on startup
   - "EMAIL DEBUG: Alert Notification" logs when alerts are triggered
   - "EMAIL NOTIFICATION DEBUG START" logs when sending emails

## Common Issues and Solutions

### 1. Gmail App Password Required
- Regular Gmail password won't work
- Need to generate App Password in Google Account settings
- Update `MAIL_PASSWORD` secret with app password

### 2. No Users with Email Alerts
- Check database: `SELECT username, enable_email_alerts FROM users;`
- Enable for admin: `UPDATE users SET enable_email_alerts = TRUE WHERE username = 'admin';`

### 3. SMTP Connection Issues
- Check firewall settings
- Verify Gmail SMTP settings (smtp.gmail.com:587)
- Check backend logs for connection errors

### 4. Alert Not Triggering
- Check item safety stock threshold is set
- Verify usage reduces inventory below threshold
- Check AlertService logs for trigger conditions

## Email Alert Trigger Logic

Email alerts are triggered when:
1. Item usage reduces current inventory below warning threshold
2. Warning threshold = safety_stock_threshold * warning_percentage (default 100%)
3. Critical threshold = safety_stock_threshold * critical_percentage (default 50%)
4. User has `enable_email_alerts = TRUE`
5. Email credentials are properly configured

## Testing Email Alerts

1. Set an item's safety stock threshold (e.g., 10)
2. Use the item via barcode scanner to reduce inventory below threshold
3. Check console logs for email debugging information
4. Check backend logs for email sending attempts
5. Check email inbox for alert notifications 