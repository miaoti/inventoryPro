# Environment Setup for Frontend

This document explains the correct environment configuration for the Smart Inventory Pro frontend.

## 📝 Required Environment File

Create a `.env.local` file in the `inventory_frontend` directory with **only** this content:

```bash
# API Configuration for Spring Boot Backend
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## ❌ What NOT to Include

The following are **NOT needed** in the frontend anymore since we use the backend for email:

```bash
# ❌ Remove these - No longer needed:
# EMAIL_USER=miaotingshuo@gmail.com
# EMAIL_PASSWORD=sohs uqyf qtdb uxvi
```

## ✅ Complete `.env.local` File

Your `inventory_frontend/.env.local` should look exactly like this:

```bash
# API Configuration for Spring Boot Backend
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## 🔧 Why This Configuration?

1. **`NEXT_PUBLIC_API_URL`**: Tells the frontend where to find the Spring Boot backend API
2. **No Email Config**: All email functionality is handled by the backend now
3. **Simplified**: Cleaner, more secure, and easier to maintain

## 🚀 How to Apply

1. **Delete** any existing `.env.local` file in `inventory_frontend/`
2. **Create** a new `.env.local` file with only the API URL
3. **Restart** the frontend development server: `npm run dev`

## 🔍 Verification

After updating, verify the frontend can connect to the backend:

1. Start backend: `cd inventory && MAIL_PASSWORD=sohs uqyf qtdb uxvi ./gradlew bootRun`
2. Start frontend: `cd inventory_frontend && npm run dev`
3. Test contact form on landing page - should send emails through backend
4. Test scanner page access:
   - **Without login**: Visit `/scanner` or `/barcode-scanner` → should show scanner page WITHOUT sidebar
   - **With login**: Visit `/scanner` or `/barcode-scanner` after logging in → should show scanner page WITH sidebar
5. Test protected pages: Visit `/dashboard`, `/items`, `/alerts` without login → should redirect to login

## 🐛 Troubleshooting

If you see errors like:
- "Failed to fetch"
- "Network request failed"
- "CORS error"

**Solution**: Ensure:
1. Backend is running on `http://localhost:8080`
2. Frontend `.env.local` has the correct `NEXT_PUBLIC_API_URL`
3. No old email environment variables are present 