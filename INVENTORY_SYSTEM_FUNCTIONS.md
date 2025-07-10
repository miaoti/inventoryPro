# Inventory Management System - Complete Function List

## Authentication Functions

### AuthController (`/auth`)
- **POST `/auth/login`** - User login with username/password
- **POST `/auth/register`** - Register new user account

---

## Item Management Functions

### ItemController (`/items`)
- **GET `/items`** - Get all items (filtered by user role/department)
- **GET `/items/{id}`** - Get specific item by ID
- **POST `/items`** - Create new item
- **PUT `/items/{id}`** - Update existing item
- **DELETE `/items/{id}`** - Delete specific item
- **DELETE `/items/bulk`** - Delete multiple items
- **POST `/items/import-csv`** - Import items from CSV/Excel file
- **GET `/items/export-barcodes`** - Export all barcodes as ZIP
- **POST `/items/regenerate-qr-codes`** - Regenerate QR codes for all items

### Department Management (OWNER only)
- **GET `/items/departments`** - Get available departments
- **POST `/items/departments`** - Create new department
- **DELETE `/items/departments/{departmentName}`** - Delete department

---

## User Management Functions

### UserController (`/user`)
- **GET `/user/settings`** - Get user settings
- **PUT `/user/settings`** - Update user settings
- **GET `/user/quick-actions`** - Get user's quick actions
- **POST `/user/quick-actions`** - Update user's quick actions

### UserManagementController (`/user-management`) - OWNER only
- **GET `/user-management`** - Get all users
- **GET `/user-management/{id}`** - Get specific user
- **POST `/user-management`** - Create new user
- **PUT `/user-management/{id}`** - Update user
- **PUT `/user-management/{id}/username`** - Update username
- **DELETE `/user-management/{id}`** - Delete user

### ProfileController (`/profile`)
- **GET `/profile`** - Get current user profile
- **PUT `/profile`** - Update user profile

---

## Statistics & Analytics Functions

### StatsController (`/stats`)
- **GET `/stats/daily-usage`** - Get daily usage statistics
- **GET `/stats/daily-usage/filtered`** - Get filtered daily usage
- **GET `/stats/top-usage`** - Get top usage items
- **GET `/stats/top-usage/filtered`** - Get filtered top usage
- **GET `/stats/low-stock`** - Get low stock items
- **GET `/stats/stock-alerts`** - Get stock alerts
- **GET `/stats/quick-stats`** - Get comprehensive quick stats (department-aware)
- **GET `/stats/departments`** - Get available departments for stats (OWNER only)

---

## Usage Tracking Functions

### UsageController (`/usage`)
- **POST `/usage/record`** - Record item usage
- **GET `/usage`** - Get all usage records
- **GET `/usage/paginated`** - Get paginated usage records
- **GET `/usage/item/{itemId}`** - Get usage for specific item
- **GET `/usage/user/{userName}`** - Get usage by specific user
- **GET `/usage/date-range`** - Get usage within date range
- **GET `/usage/department/{department}`** - Get usage by department
- **GET `/usage/barcode-or-item/{searchTerm}`** - Search usage by barcode/item
- **GET `/usage/filtered`** - Get filtered usage records
- **GET `/usage/summary/items`** - Get usage summary by items
- **GET `/usage/summary/users`** - Get usage summary by users
- **GET `/usage/export/excel`** - Export usage to Excel
- **GET `/usage/export/excel/date-range`** - Export date-range usage to Excel
- **GET `/usage/export/excel/filtered`** - Export filtered usage to Excel

---

## Alert Management Functions

### AlertController (`/alerts`)
- **GET `/alerts`** - Get all alerts
- **GET `/alerts/active`** - Get active alerts
- **GET `/alerts/ignored`** - Get ignored alerts
- **GET `/alerts/resolved`** - Get resolved alerts
- **GET `/alerts/count`** - Get alert count
- **GET `/alerts/unread`** - Get unread alerts
- **POST `/alerts/{id}/read`** - Mark alert as read
- **POST `/alerts/{id}/resolve`** - Resolve alert
- **GET `/alerts/export/excel`** - Export alerts to Excel

---

## Purchase Order Functions

### PurchaseOrderController (`/purchase-orders`)
- **GET `/purchase-orders/{itemId}/purchase-orders`** - Get purchase orders for item
- **GET `/purchase-orders/{itemId}/purchase-orders/pending`** - Get pending purchase orders
- **POST `/purchase-orders/{itemId}/purchase-orders`** - Create purchase order
- **PUT `/purchase-orders/{itemId}/purchase-orders/{id}`** - Update purchase order
- **POST `/purchase-orders/purchase-orders/{id}/arrive`** - Mark purchase order as arrived
- **GET `/purchase-orders/{itemId}/purchase-orders/pending-quantity`** - Get pending quantity

### PurchaseOrderStatsController (`/purchase-order-stats`)
- **GET `/purchase-order-stats`** - Get purchase order statistics
- **GET `/purchase-order-stats/item/{itemId}`** - Get stats for specific item
- **GET `/purchase-order-stats/pending`** - Get pending purchase orders stats
- **GET `/purchase-order-stats/arrived`** - Get arrived purchase orders stats

---

## System Administration Functions

### SystemLogController (`/system-logs`) - OWNER only
- **GET `/system-logs`** - Get all system logs
- **GET `/system-logs/statistics`** - Get log statistics
- **DELETE `/system-logs/bulk`** - Delete multiple logs
- **DELETE `/system-logs/cleanup`** - Clean up old logs
- **GET `/system-logs/recent`** - Get recent logs
- **GET `/system-logs/{id}`** - Get specific log entry
- **GET `/system-logs/filters`** - Get available log filters

### AdminSettingsController (`/admin-settings`) - OWNER only
- **GET `/admin-settings/item-display`** - Get item display settings
- **POST `/admin-settings/item-display`** - Update item display settings
- **GET `/admin-settings/alert-thresholds`** - Get alert threshold settings
- **POST `/admin-settings/alert-thresholds`** - Update alert threshold settings

---

## Public Access Functions

### PublicBarcodeController (`/public/barcode`)
- **GET `/public/barcode/scan/{barcode}`** - Scan barcode for public access
- **POST `/public/barcode/use`** - Use item via barcode
- **POST `/public/barcode/use/{barcode}`** - Use specific barcode
- **POST `/public/barcode/create-po/{barcode}`** - Create purchase order via barcode
- **GET `/public/barcode/pending-pos/{barcode}`** - Get pending purchase orders
- **POST `/public/barcode/arrive-po/{purchaseOrderId}`** - Mark PO as arrived
- **POST `/public/barcode/add-pending-po/{barcode}`** - Add pending purchase order
- **POST `/public/barcode/confirm-restock/{barcode}`** - Confirm restock
- **GET `/public/barcode/debug/items`** - Debug items endpoint

### PublicQRController (`/public/qr`)
- **GET `/public/qr/item/{qrCodeId}`** - Get item info via QR code
- **POST `/public/qr/use/{qrCodeId}`** - Use item via QR code

### PublicItemsController (`/public/items`)
- **GET `/public/items/search`** - Search public items

### BarcodeController (`/barcode`)
- **GET `/barcode/{barcodeText}`** - Get barcode information

---

## Contact Functions

### ContactController (`/contact`)
- **POST `/contact/submit`** - Submit contact form
- **GET `/contact/info`** - Get contact information

---

## Frontend Pages & Features

### Dashboard Pages
- **Dashboard** (`/dashboard`) - Main dashboard with overview
- **Quick Stats** (`/quick-stats`) - Department-aware statistics dashboard
- **Usage Reports** (`/usage-reports`) - Detailed usage reporting
- **Items Management** (`/items`) - Item CRUD operations
- **Alerts** (`/alerts`) - Alert management interface
- **Profile** (`/profile`) - User profile management
- **Settings** (`/settings`) - User settings configuration

### Admin Pages (OWNER only)
- **User Management** (`/admin/users`) - User administration
- **Purchase Orders** (`/admin/purchase-orders`) - Purchase order management
- **System Logs** (`/owner/logs`) - System log viewing
- **Admin Settings** (`/admin-settings`) - System configuration

### Scanning & Public Access
- **Scanner** (`/scanner`) - Barcode/QR code scanner
- **QR Usage** (`/qr-usage/[qrCodeId]`) - QR code usage tracking
- **Redirect Scanner** (`/redirect-scanner`) - Scanner redirect page

---

## Role-Based Access Summary

### OWNER Users
- **Full System Access**: All functions available
- **Department Management**: Create, delete, manage departments
- **User Management**: Full user administration
- **System Administration**: Access to system logs and settings
- **Cross-Department Access**: Can view data from all departments
- **Global Statistics**: Access to system-wide analytics

### ADMIN Users
- **Department-Specific Access**: Limited to their assigned department
- **Item Management**: Manage items within their department
- **User Operations**: Basic user functions (no user creation/deletion)
- **Department Statistics**: View stats for their department only
- **Limited System Access**: No access to system logs or global settings
- **Purchase Orders**: Manage purchase orders for their department

### USER Users
- **Basic Operations**: View items, record usage, manage profile
- **Department-Restricted**: Only access their department's data
- **No Administrative Functions**: Cannot manage users or system settings
- **Limited Statistics**: Basic usage statistics for their department

---

## Security Features
- **JWT Authentication**: Token-based authentication for all protected endpoints
- **Role-Based Access Control**: Function access based on user role
- **Department Isolation**: Data access restricted by department
- **Method-Level Security**: `@PreAuthorize` annotations for fine-grained control
- **System Logging**: Comprehensive audit trail for all operations
- **Input Validation**: Request validation and sanitization
- **CORS Configuration**: Cross-origin request handling 