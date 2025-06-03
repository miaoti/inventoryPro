# Frontend to Backend Integration Guide

This document explains how the frontend now integrates with the Spring Boot backend for email functionality.

## 🔄 Changes Made

### 1. **Contact Form Integration**
- **OLD**: Frontend used Next.js API route `/api/contact` with Nodemailer
- **NEW**: Frontend calls Spring Boot backend `/api/contact/submit`

### 2. **Alert Email Notifications**
- **OLD**: Frontend manually sent emails via `/api/alerts/notify` 
- **NEW**: Backend automatically sends emails when alerts are created
- **Result**: Removed frontend email notification code from `alertsSlice.ts`

### 3. **Email Dependencies**
- **Removed**: `nodemailer` and `@types/nodemailer` from frontend
- **Added**: API integration with Spring Boot backend

## 🛠️ Frontend Configuration

### Environment Variables
Create a `.env.local` file in the `inventory_frontend` directory:

```bash
# API Configuration for Spring Boot Backend
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### API Endpoints Used

#### Contact Form Submission
```typescript
// Frontend calls this endpoint
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contact/submit`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: formData.name,
    email: formData.email,
    company: formData.company,
    phone: formData.phone,
    message: formData.message,
    subject: 'New Contact Form Submission - Smart Inventory Pro'
  })
});
```

#### User Registration (Future)
```typescript
// For user registration with welcome emails
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'johndoe',
    email: 'john@example.com',
    fullName: 'John Doe',
    password: 'securepassword',
    role: 'USER'
  })
});
```

## 📧 Email Flow

### 1. **Contact Forms**
```
User submits form → Frontend → Backend /contact/submit → Backend sends email to miaotingshuo@gmail.com
```

### 2. **Alert Notifications**
```
Item usage recorded → Backend AlertService → Automatic email sent to miaotingshuo@gmail.com
```

### 3. **User Registration**
```
New user registers → Backend AuthController → Automatic welcome email sent
```

### 4. **Daily Summaries**
```
Scheduled job (9:00 AM PST) → Backend sends daily alert summary email
```

## 🔧 Benefits of Backend Integration

### 1. **Centralized Email Management**
- All email sending logic in one place (backend)
- Consistent email templates and branding
- Better error handling and logging

### 2. **Improved Security**
- Email credentials stored securely in backend
- No sensitive information in frontend code
- Better CORS and authentication handling

### 3. **Better Performance**
- No email processing on frontend
- Reduced bundle size (removed Nodemailer)
- Asynchronous email sending doesn't block UI

### 4. **Enhanced Features**
- Professional HTML email templates
- Scheduled daily/weekly summaries
- Automatic alert notifications
- Welcome emails for new users

## 🚀 How to Run

### 1. **Start Backend** (Required)
```bash
cd inventory
MAIL_PASSWORD=sohs uqyf qtdb uxvi ./gradlew bootRun
```

### 2. **Start Frontend**
```bash
cd inventory_frontend
npm run dev
```

### 3. **Environment Setup**
Ensure the backend is running on `http://localhost:8080` and the frontend can access `/api` endpoints.

## 🔍 Testing

### Contact Form
1. Visit the landing page
2. Click "Get Started Free"
3. Fill out the contact form
4. Submit and check `miaotingshuo@gmail.com` for the email

### Scanner Page Access
1. **Without Login**: Visit `/scanner` → Shows scanner functionality WITHOUT sidebar menu
2. **With Login**: Visit `/scanner` after logging in → Shows scanner functionality WITH sidebar menu
3. **Protected Pages**: Visit `/dashboard`, `/items`, `/alerts` without login → Redirects to login page

### Alert Notifications
1. Add an item with low inventory (when logged in)
2. Use the item to trigger an alert
3. Backend automatically sends email notification

### User Registration
1. Use the `/api/auth/register` endpoint
2. New user receives automatic welcome email

## 🐛 Troubleshooting

### Frontend Issues
- **Error**: "Failed to fetch"
  - **Solution**: Ensure backend is running on port 8080
  - **Check**: CORS configuration in Spring Boot

- **Error**: "Network request failed"
  - **Solution**: Verify `NEXT_PUBLIC_API_URL` environment variable
  - **Check**: Backend API endpoints are accessible

### Backend Issues
- **Error**: "Authentication failed"
  - **Solution**: Set `MAIL_PASSWORD=sohs uqyf qtdb uxvi` environment variable
  - **Check**: Gmail 2FA and App Password setup

- **Error**: "Email not sending"
  - **Solution**: Check backend logs for SMTP errors
  - **Check**: Gmail account configuration

## 📝 Code Changes Summary

### Files Modified
- `inventory_frontend/app/page.tsx` - Updated contact form to use backend
- `inventory_frontend/app/store/slices/alertsSlice.ts` - Removed email logic

### Files Removed
- `inventory_frontend/app/api/contact/route.ts` - No longer needed
- `inventory_frontend/app/api/alerts/notify/route.ts` - No longer needed

### Dependencies
- **Can Remove**: `nodemailer`, `@types/nodemailer` from package.json
- **Backend Handles**: All email functionality

## 🎯 Result

The frontend now has a clean separation of concerns:
- **Frontend**: UI/UX and user interactions
- **Backend**: Business logic, data persistence, and email services

All email functionality is centralized in the Spring Boot backend with professional templates, automatic notifications, and comprehensive logging. 