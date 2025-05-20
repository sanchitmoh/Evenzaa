# EventEvenzaaa

A modern event booking platform for movies, concerts, sports events and more.

## Features

### Core Features
- User registration and login with email/password and social login (Google, GitHub)
- Browse and search events by category (movies, concerts, sports)
- Interactive seat selection with real-time availability
- Secure payment processing with Razorpay
- Digital ticket generation with QR codes
- Email notifications for bookings and tickets
- User dashboard with booking history and upcoming events

### Admin Features
- Administrative dashboard with analytics and metrics
- Content management for events, venues, and seating
- User management and role assignment

## Technology Stack

### Frontend
- React 18 with TypeScript
- Material UI and Tailwind CSS
- React Router for navigation
- Axios for API requests
- Firebase Authentication

### Backend
- Spring Boot 3
- Java 17
- MySQL database
- Redis for caching
- Spring Security with JWT
- RESTful API architecture

### Integrations
- Razorpay payment gateway
- Firebase authentication
- Cloudinary for image storage
- Email service for notifications
- PDF ticket generation with QR codes

## Getting Started

### Prerequisites
- Java 17+
- Node.js 16+
- MySQL 8.0
- Redis (optional for caching)

### Backend Setup
```bash
# Clone repository
git clone https://github.com/yourusername/EventEvenzaaa.git

# Navigate to backend directory
cd EventEvenzaaa/Evenza-New/backend

# Configure database in application.properties
# ...

# Run the application
./mvnw spring-boot:run
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd EventEvenzaaa/Evenza-New/evenza-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Access the application at http://localhost:5173
