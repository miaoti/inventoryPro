# Email Backend Setup Guide for Smart Inventory Pro

This guide explains how to configure and use the email backend functionality in the Spring Boot application.

## 📧 Features Implemented

### 1. **Alert Notifications**
- Automatic email notifications when new inventory alerts are created
- Professional HTML email templates with urgent/warning indicators
- Detailed item information and inventory status tables

### 2. **Contact Form Handling**
- REST endpoint for contact form submissions
- Email notifications sent to admin email
- Reply-to functionality for direct responses

### 3. **Welcome Emails**
- Automatic welcome emails for new user registrations
- Getting started guide included
- Optional temporary password support

### 4. **Daily/Weekly Summaries**
- Scheduled daily summary emails at 9:00 AM PST
- Weekly summary emails every Monday
- Alert count and status overview

## 🛠️ Setup Instructions

### 1. **Environment Variables**
Create a `.env` file or set the following environment variables:

```bash
# Required - Gmail App Password
MAIL_PASSWORD=your_gmail_app_password_here

# Optional - Email addresses (defaults to miaotingshuo@gmail.com)
MAIL_USERNAME=miaotingshuo@gmail.com
ALERTS_EMAIL=miaotingshuo@gmail.com
CONTACT_EMAIL=miaotingshuo@gmail.com
SUPPORT_EMAIL=miaotingshuo@gmail.com

# Optional - Email features
SEND_EMAIL_NOTIFICATIONS=true
```

### 2. **Gmail Setup**
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account → Security → App passwords
   - Generate password for "Mail"
   - Use this 16-character password as `MAIL_PASSWORD`

### 3. **Application Configuration**
The `application.yml` is already configured with:
- Gmail SMTP settings
- Email timeouts and connection settings
- App-specific email configuration

## 🔧 Email Service Components

### 1. **EmailService Interface**
```java
// Available methods:
sendAlertNotification(Alert alert, String recipientEmail)
sendContactFormNotification(ContactFormRequest contactForm, String recipientEmail)
sendWelcomeEmail(String userEmail, String userName, String temporaryPassword)
sendLowStockSummary(String recipientEmail, long alertCount)
```

### 2. **REST Endpoints**

#### Contact Form Submission
```http
POST /api/contact/submit
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "company": "Example Corp",
  "phone": "+1-555-0123",
  "message": "Interested in your inventory system",
  "subject": "Product Inquiry"
}
```

#### Contact Information
```http
GET /api/contact/info
```

#### User Registration (with welcome email)
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "fullName": "John Doe",
  "password": "securepassword",
  "role": "USER"
}
```

### 3. **Scheduled Jobs**
- **Daily Summary**: Every day at 9:00 AM PST
- **Weekly Summary**: Every Monday at 9:00 AM PST

## 📨 Email Templates

### Alert Notification Email
- **Subject**: `🚨 URGENT Inventory Alert: [Item Name] - Smart Inventory Pro`
- **Features**:
  - Urgency indicators (🚨 for critical, ⚠️ for warning)
  - Detailed item information table
  - Current inventory status with color coding
  - Action required section
  - Professional styling with gradients

### Contact Form Email
- **Subject**: `New Contact Form Submission - Smart Inventory Pro`
- **Features**:
  - Contact information table
  - Message content
  - Reply-to functionality
  - Submission timestamp

### Welcome Email
- **Subject**: `Welcome to Smart Inventory Pro`
- **Features**:
  - Welcome message with user's name
  - Getting started checklist
  - Optional temporary password section
  - Support contact information

### Daily/Weekly Summary
- **Subject**: `Daily Inventory Alert Summary - Smart Inventory Pro`
- **Features**:
  - Alert count display
  - Color-coded status (red for alerts, green for no alerts)
  - Summary message
  - Generation timestamp

## 🔧 Integration Points

### 1. **AlertService Integration**
```java
// Automatic email sending when alerts are created
Alert savedAlert = alertRepository.save(alert);
sendNotification(savedAlert); // Sends email automatically
```

### 2. **User Registration Integration**
```java
// Welcome email sent after successful registration
User savedUser = userService.save(newUser);
emailService.sendWelcomeEmail(savedUser.getEmail(), savedUser.getFullName(), null);
```

### 3. **Frontend Integration**
Contact forms can submit to `/api/contact/submit` endpoint which will:
1. Process the form data
2. Send email notification to admin
3. Return success/error response

## ⚙️ Configuration Options

### Application Properties
```yaml
app:
  alerts:
    notification-email: miaotingshuo@gmail.com
    send-email-notifications: true
  contact:
    notification-email: miaotingshuo@gmail.com
  email:
    from-name: "Smart Inventory Pro"
    support-email: miaotingshuo@gmail.com
```

### Email Settings
```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: ${MAIL_USERNAME:miaotingshuo@gmail.com}
    password: ${MAIL_PASSWORD}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
          connectiontimeout: 5000
          timeout: 5000
          writetimeout: 5000
```

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify Gmail App Password is correct (16 characters, no spaces)
   - Ensure 2FA is enabled on Gmail account
   - Check MAIL_PASSWORD environment variable

2. **Emails Not Sending**
   - Check application logs for error messages
   - Verify SMTP connectivity
   - Test with `spring.mail.test-connection=true`

3. **Emails Going to Spam**
   - Add sender email to contacts
   - Check email content for spam triggers
   - Consider using dedicated email service for production

### Logging
Enable detailed email logging:
```yaml
logging:
  level:
    org.springframework.mail: DEBUG
    com.inventory.service.impl.EmailServiceImpl: DEBUG
```

## 🚀 Production Considerations

1. **Email Service Provider**
   - Consider using SendGrid, Mailgun, or Amazon SES for production
   - Implement rate limiting for contact forms
   - Add email delivery tracking

2. **Security**
   - Use secure environment variable management
   - Implement email validation and sanitization
   - Add CAPTCHA to contact forms

3. **Performance**
   - Implement asynchronous email sending
   - Add retry mechanisms for failed emails
   - Monitor email delivery rates

## 📊 Monitoring

The system logs all email activities:
- Successful email sends
- Failed email attempts
- Scheduled job executions
- Contact form submissions

Monitor these logs to ensure email functionality is working correctly.

## 🔗 Frontend Integration

The backend email service is designed to work with:
- Next.js frontend API routes (existing)
- Direct backend API calls
- Mobile applications
- Third-party integrations

All endpoints support CORS for frontend integration and return standardized JSON responses. 