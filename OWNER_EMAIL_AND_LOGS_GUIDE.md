# OWNER User Email Notifications and System Log Viewer

## Overview
This guide documents the comprehensive changes made to ensure OWNER users:
1. **Always receive email notifications** for inventory alerts (regardless of email alert settings)
2. **Have exclusive access to system logs** for monitoring and troubleshooting

## 🚨 Email Notification Enhancements for OWNER Users

### 1. Database Changes
- **New Migration**: `V18__create_owner_user.sql`
  - Creates initial OWNER user with credentials: `owner/admin123`
  - Email: `owner@company.com`
  - Ensures both admin and owner users have email alerts enabled

### 2. Backend Service Enhancements

#### AlertService.java
- **Enhanced Alert Notifications**: OWNER users now receive ALL alert notifications
- **Enhanced Daily Summaries**: OWNER users receive daily digest emails
- **Comprehensive Logging**: Added detailed debugging logs for email notifications

```java
// OWNER users are ALWAYS included in notifications
List<User> ownerUsers = userService.findByRole(User.UserRole.OWNER);
Set<User> allNotificationUsers = new HashSet<>(usersWithAlerts);
for (User owner : ownerUsers) {
    allNotificationUsers.add(owner); // OWNER always gets notifications
}
```

#### UserService and Repository
- **New Method**: `findByRole(User.UserRole role)` to find users by role
- **OWNER Priority**: OWNER users bypass email alert enable/disable settings

### 3. Email Configuration Debug Enhancement
- **DebugController.java**: Enhanced to show OWNER users separately
- **Email Config Endpoint**: `/api/debug/email-config` now shows:
  - Users with email alerts enabled
  - OWNER users (who get forced notifications)
  - Combined notification recipients

## 📊 System Log Viewer for OWNER Users Only

### 1. Backend Log Controller
- **New Controller**: `LogController.java` with `@PreAuthorize("hasRole('OWNER')")`
- **Endpoints**:
  - `GET /api/owner/logs/application` - Application logs from file or docker
  - `GET /api/owner/logs/docker` - Docker container logs
  - `GET /api/owner/logs/system-status` - JVM and system information
  - `GET /api/owner/logs/filtered` - Filtered logs by level/search

### 2. Frontend Log Viewer Page
- **Location**: `/owner/logs` (accessible only to OWNER users)
- **Features**:
  - **Real-time Log Viewing**: Auto-refresh with configurable intervals
  - **Multiple Log Sources**: Application logs, Docker logs, System status
  - **Advanced Filtering**: Filter by log level (ERROR, WARN, INFO, DEBUG)
  - **Search Functionality**: Search logs with highlighting
  - **Download Capability**: Download logs as .log files
  - **System Monitoring**: JVM memory, CPU, disk usage
  - **Professional UI**: Color-coded log levels, hover effects, badges

### 3. Navigation Enhancement
- **Layout.tsx**: Added "System Logs" menu item for OWNER users only
- **Icon**: Red bug report icon to indicate system-level access
- **Security**: Menu item only visible to users with OWNER role

## 🔐 Security Features

### 1. Role-Based Access Control
- **Backend**: `@PreAuthorize("hasRole('OWNER')")` ensures only OWNER users access logs
- **Frontend**: Role checking prevents non-OWNER users from seeing log interface
- **Navigation**: Log viewer menu only appears for OWNER users

### 2. Log Access Protection
- **File System Access**: Secure reading of application log files
- **Docker Integration**: Safe execution of docker logs commands
- **Error Handling**: Graceful handling of permission and access errors

### 3. Rate Limiting and Safety
- **Max Lines**: Limited to 1000 lines per request to prevent memory issues
- **Auto-refresh Control**: Configurable intervals (1-60 seconds)
- **Background Jobs**: Auto-refresh runs in background without blocking UI

## 📧 Email Notification Logic

### Alert Notifications
```
When inventory falls below safety threshold:
1. Find users with email alerts enabled
2. Find all OWNER users (regardless of alert settings)
3. Combine and deduplicate the lists
4. Send notification to all users in combined list
5. Log detailed information about each email sent
```

### Daily Summary Emails
```
Daily digest process:
1. Find users with daily digest enabled
2. Find all OWNER users (regardless of digest settings)
3. Combine and deduplicate the lists
4. Send daily summary to all users in combined list
5. Include active alert count and system status
```

## 🛠️ Configuration Requirements

### GitHub Secrets
- `MAIL_USERNAME`: Gmail account for sending emails
- `MAIL_PASSWORD`: Gmail app password (not regular password)

### Database Users
- **OWNER User**: `owner/admin123` with email alerts enabled
- **ADMIN User**: `admin/admin123` with email alerts enabled

### Spring Configuration
- **Mail Config**: Automatic SMTP configuration with debug logging
- **Log File**: `/app/logs/inventory.log` for persistent logging
- **Docker Logs**: Direct access to container logs via docker command

## 📱 User Interface Features

### Log Viewer Dashboard
- **Tabbed Interface**: Application Logs, Docker Logs, System Status, Filtered Logs
- **Control Panel**: Lines count, log level filter, search, auto-refresh toggle
- **Real-time Updates**: Live log streaming with configurable intervals
- **Professional Design**: Color-coded log levels, hover effects, badges

### System Status Monitoring
- **JVM Information**: Memory usage, CPU cores, heap sizes
- **System Details**: Java version, OS info, timezone, active profiles
- **Application Status**: Log file existence, configuration validation

### Log Management
- **Download Feature**: Export logs with timestamp in filename
- **Search and Filter**: Advanced filtering with text highlighting
- **Auto-refresh**: Configurable real-time updates (1-60 second intervals)
- **Error Handling**: Graceful handling of access errors and timeouts

## 🚀 Benefits for OWNER Users

### 1. Complete System Visibility
- **All Notifications**: Never miss critical inventory alerts
- **System Monitoring**: Real-time access to application and system logs
- **Troubleshooting**: Advanced debugging capabilities with log filtering

### 2. Operational Control
- **Email Override**: Get notifications even if alerts are disabled
- **Log Access**: Direct access to backend logs without SSH
- **System Health**: Monitor JVM performance and system resources

### 3. Security and Compliance
- **Audit Trail**: Complete log access for compliance requirements
- **Access Control**: Exclusive access to sensitive system information
- **Professional Interface**: Enterprise-grade log viewing capabilities

## 🔧 Testing the Implementation

### 1. Test Email Notifications
1. Login as OWNER user (`owner/admin123`)
2. Use scanner to reduce item inventory below safety threshold
3. Check browser console for email debug logs
4. Verify email sent to owner@company.com

### 2. Test Log Viewer
1. Login as OWNER user
2. Navigate to "System Logs" in sidebar
3. View different log types (Application, Docker, System Status)
4. Test filtering, searching, and auto-refresh features

### 3. Test Access Control
1. Login as ADMIN or USER
2. Verify "System Logs" menu item is not visible
3. Try accessing `/owner/logs` directly - should be denied

## 📝 Default Credentials

- **OWNER**: `owner/admin123` (email: owner@company.com)
- **ADMIN**: `admin/admin123` (email: admin@company.com)

Both users have email alerts enabled and will receive inventory notifications.

## 🏗️ Future Enhancements

- **Real-time Log Streaming**: WebSocket-based live log updates
- **Log Retention Policies**: Automated log rotation and cleanup
- **Performance Metrics**: CPU, memory, and disk usage graphs
- **Alert History**: Historical view of all sent notifications
- **Export Features**: CSV export of log data and system metrics 