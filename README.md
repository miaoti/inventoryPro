# Inventory Management System

A web-based inventory management system built with Spring Boot, React.js, and MySQL.

## Features

- User authentication and authorization
- Item management (CRUD operations)
- Barcode scanning for inventory updates
- Real-time inventory tracking
- Alert system for low stock items
- Dashboard with key metrics
- Responsive Material-UI design

## Prerequisites

- Java 17 or higher
- Node.js 16 or higher
- Docker and Docker Compose
- Gradle

## Project Structure

```
inventory_stock/
├── inventory/                 # Spring Boot backend
│   ├── src/
│   └── build.gradle
├── inventory_frontend/        # React frontend
│   ├── src/
│   └── package.json
└── docker-compose.yml         # Docker configuration
```

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd inventory_stock
```

### 2. Start the Database

```bash
# Start MySQL container
docker-compose up -d

# Verify the container is running
docker-compose ps
```

The MySQL database will be available at:
- Host: localhost
- Port: 3306
- Database: inventory_db
- Username: inventory_user
- Password: inventory_password

### 3. Run the Backend

```bash
# Navigate to the backend directory
cd inventory

# Build the project
./gradlew clean build

# Run the application
./gradlew bootRun
```

The backend API will be available at:
- URL: http://localhost:8080/api
- Default admin credentials:
  - Username: admin
  - Password: admin123

### 4. Run the Frontend

```bash
# Navigate to the frontend directory
cd inventory_frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend application will be available at:
- URL: http://localhost:3000

## Development

### Backend Development

The Spring Boot application uses:
- Spring Boot 3.2.3
- Java 17
- Spring Security for authentication
- JPA/Hibernate for database operations
- JWT for token-based authentication
- MySQL as the database

Key configuration files:
- `application.yml`: Application and database configuration
- `data.sql`: Initial data for testing

### Frontend Development

The React application uses:
- TypeScript for type safety
- Material-UI for components
- Redux for state management
- React Router for navigation

Key features:
- Responsive design
- Protected routes
- API integration
- Toast notifications

## API Endpoints

### Authentication
- POST /api/auth/login
- POST /api/auth/register

### Items
- GET /api/items
- GET /api/items/{id}
- POST /api/items
- PUT /api/items/{id}
- DELETE /api/items/{id}
- POST /api/items/scan-barcode
- POST /api/items/{id}/inventory

### Alerts
- GET /api/alerts
- GET /api/alerts/unread
- PUT /api/alerts/{id}/read
- PUT /api/alerts/read-all

## Environment Variables

### Backend
- `JWT_SECRET`: Secret key for JWT token generation
- `MAIL_USERNAME`: Email username for notifications
- `MAIL_PASSWORD`: Email password for notifications

### Frontend
- `REACT_APP_API_URL`: Backend API URL (default: http://localhost:8080/api)

## Troubleshooting

1. Database Connection Issues
   - Ensure MySQL container is running: `docker-compose ps`
   - Check database logs: `docker-compose logs mysql`
   - Verify database credentials in `application.yml`

2. Backend Issues
   - Check application logs
   - Verify Java version: `java -version` (should be 17 or higher)
   - Ensure all dependencies are installed: `./gradlew dependencies`
   - If you see "Unsupported class file major version" error:
     - Make sure you're using Java 17
     - Run `./gradlew clean build --refresh-dependencies`
     - Check JAVA_HOME environment variable
   - If build fails, try:
     - Delete the build directory: `rm -rf build`
     - Delete Gradle cache: `rm -rf ~/.gradle/caches`
     - Rebuild: `./gradlew clean build`

3. Frontend Issues
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check for TypeScript errors: `npm run type-check`
   - Verify API connection in browser dev tools

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
