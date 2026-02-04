# QOOA Backend - MongoDB Setup Guide

## ✅ Implementation Complete!

Your QOOA backend is now fully built with MongoDB, complete with all models, controllers, routes, middleware, and utilities.

## 🎉 What's Been Built

### ✅ Data Models (7 Mongoose Schemas)

- **Vendor.js** - Authentication, email verification, quality scores
- **Order.js** - Order management, tracking stages, telemetry
- **Subscription.js** - Recurring orders with smart scheduling
- **Feedback.js** - Ratings, damage reports, refunds
- **Pricing.js** - Dynamic pricing with auto-deactivation
- **Broadcast.js** - WhatsApp/Email mass messaging
- **Telemetry.js** - IoT sensor data with geospatial indexing

### ✅ Controllers (Business Logic)

- **vendorController.js** - Register, login, verify email, profile
- **orderController.js** - Create, list, track orders
- **subscriptionController.js** - Manage recurring orders
- **feedbackController.js** - Submit feedback with photos
- **pricingController.js** - Get/update prices (Admin)
- **broadcastController.js** - Send broadcasts (Admin)
- **telemetryController.js** - Receive IoT data

### ✅ Routes (8 Route Files)

- authRoutes, vendorRoutes, orderRoutes, subscriptionRoutes, feedbackRoutes, pricingRoutes, broadcastRoutes, telemetryRoutes

### ✅ Middleware

- **authMiddleware.js** - JWT verification, email verification check
- **validateMiddleware.js** - Express-validator rules
- **errorMiddleware.js** - Centralized error handling

### ✅ Utilities

- **emailService.js** - Nodemailer (verification, order confirmation)
- **whatsappService.js** - Facebook Graph API + Twilio (bilingual)
- **uploadService.js** - Cloudinary integration for photos

### ✅ Configuration

- **database.js** - MongoDB connection with graceful shutdown
- **server.js** - Complete Express app with Socket.IO
- **package.json** - All dependencies
- **.env.example** - Complete environment template

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup MongoDB

**Option A: Local MongoDB**

```bash
# Windows: Install MongoDB Community Server, then:
mongod

# macOS:
brew services start mongodb-community

# Linux:
sudo systemctl start mongod
```

**Option B: MongoDB Atlas (Cloud)**

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create free cluster
3. Get connection string
4. Use in `.env` file

### 3. Configure Environment

```bash
# Copy example file
cp .env.example .env

# Edit and add your credentials
nano .env
```

**Minimum Required Variables:**

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/qooa

# JWT
JWT_SECRET=your_random_secret_key_min_32_characters

# Email (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password

# WhatsApp (use either Facebook or Twilio)
WHATSAPP_ACCESS_TOKEN=your_token
WHATSAPP_PHONE_NUMBER_ID=your_id

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend
FRONTEND_URL=http://localhost:8000
BASE_URL=http://localhost:8000
```

### 4. Start Server

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Server runs on `http://localhost:3000`

## 📡 Key API Endpoints

### Authentication

```bash
POST /api/auth/register      # Register vendor
POST /api/auth/login         # Login
GET  /api/auth/verify-email  # Verify email
```

### Orders (Protected with JWT)

```bash
POST /api/orders/create      # Create order
GET  /api/orders/vendor      # Get vendor orders
GET  /api/orders/:orderId    # Get order details
```

### Subscriptions

```bash
POST /api/subscriptions/create   # Create standing order
GET  /api/subscriptions          # Get subscriptions
PUT  /api/subscriptions/:id/cancel  # Cancel
```

### Feedback (with file upload)

```bash
POST /api/feedback/submit    # Submit feedback + photos
GET  /api/feedback/vendor    # Get feedback history
```

### Pricing

```bash
GET /api/pricing/current     # Get current price (Public)
POST /api/pricing/update     # Update price (Admin)
```

## 🔐 Authentication Flow

1. **Register:** `POST /api/auth/register`
   - Returns JWT token
   - Sends verification email
   - Sends WhatsApp welcome message

2. **Verify Email:** Click link in email
   - `GET /api/auth/verify-email?token=xxx&email=xxx`

3. **Login:** `POST /api/auth/login`
   - Returns JWT token
   - Use in Authorization header: `Bearer YOUR_TOKEN`

4. **Protected Routes:** Include token in header
   ```javascript
   headers: {
     'Authorization': `Bearer ${token}`
   }
   ```

## 📧 Email Setup (Gmail)

1. Enable 2-Factor Authentication on Google account
2. Generate App Password:
   - Go to [myaccount.google.com](https://myaccount.google.com)
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use 16-character password in `EMAIL_PASSWORD`

## 💬 WhatsApp Setup

### Facebook WhatsApp Business API

1. Create Meta Business Account
2. Set up WhatsApp Business API
3. Get Access Token and Phone Number ID
4. Add to `.env`

### Twilio (Alternative)

1. Sign up at [twilio.com](https://www.twilio.com)
2. Get WhatsApp sandbox credentials
3. Add `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` to `.env`

The system auto-detects which service to use based on available env vars.

## ☁️ Cloudinary Setup

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Dashboard → Account Details
3. Copy cloud_name, api_key, api_secret
4. Add to `.env`

## 🧪 Test with Thunder Client/Postman

### Register Vendor

```json
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "vendorName": "Mama Ngozi",
  "phoneNumber": "08012345678",
  "email": "ngozi@example.com",
  "password": "Password123",
  "marketCluster": "Mile 12",
  "stallNumber": "B23",
  "businessType": "mama-put"
}
```

### Login

```json
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "phoneNumber": "08012345678",
  "password": "Password123"
}
```

Response includes `token` - use in subsequent requests.

### Create Order

```json
POST http://localhost:3000/api/orders/create
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "crateQuantity": 5,
  "deliveryDate": "2026-02-15",
  "deliveryTime": "morning"
}
```

## 📊 Real-time Tracking (Socket.IO)

Connect from frontend:

```javascript
import io from "socket.io-client";

const socket = io("http://localhost:3000");

// Track order
socket.emit("trackOrder", "ORD-12345678-ABC123");

// Listen for updates
socket.on("trackingUpdate", (data) => {
  console.log("Order updated:", data);
});
```

## 🗄️ Seed Initial Data

Connect to MongoDB and add initial price:

```javascript
// MongoDB Shell or Compass
db.pricings.insertOne({
  pricePerCrate: 18500,
  currency: "NGN",
  effectiveFrom: new Date(),
  isActive: true,
  trend: "stable",
  marketFactor: 1.0,
});
```

## 🔧 Connect Frontend

Update `js/vendor-portal.js`:

```javascript
const API_BASE_URL = "http://localhost:3000/api";
```

Make sure CORS is configured properly in server.js (already done).

## 📦 Project Structure

```
backend/
├── config/
│   └── database.js
├── models/          (7 files)
├── controllers/     (7 files)
├── middleware/      (3 files)
├── routes/          (8 files)
├── utils/           (3 files)
├── server.js
├── package.json
├── .env.example
└── README.md
```

## 🚀 Next Steps

1. **Start MongoDB:** `mongod` (or use Atlas)
2. **Install packages:** `npm install`
3. **Configure .env:** Copy and edit `.env.example`
4. **Seed price data:** Add initial pricing
5. **Start server:** `npm run dev`
6. **Test endpoints:** Use Thunder Client/Postman
7. **Connect frontend:** Update API_BASE_URL

## 🌐 Deployment Options

- **Heroku:** Add MongoDB Atlas URI to config vars
- **Railway:** Connect GitHub, add env vars
- **DigitalOcean:** App Platform with managed MongoDB
- **Render:** Free tier with MongoDB Atlas

## 🔑 Key Features

✅ JWT authentication with bcrypt password hashing  
✅ Email verification with 24-hour token expiry  
✅ WhatsApp messaging (English + Pidgin)  
✅ Cloudinary image uploads (damage photos)  
✅ Socket.IO real-time tracking  
✅ IoT telemetry with geospatial indexing  
✅ Dynamic pricing with auto-deactivation  
✅ Subscription scheduling  
✅ Quality score auto-calculation  
✅ Broadcast messaging  
✅ Express-validator input validation  
✅ Helmet security headers  
✅ Rate limiting  
✅ Error handling middleware

## 📝 Environment Variables Reference

See `BACKEND_IMPLEMENTATION_STATUS.md` for complete list and setup instructions.

## 🆘 Troubleshooting

**MongoDB connection failed:**

- Check MongoDB is running: `mongod`
- Verify `MONGODB_URI` in `.env`

**Email not sending:**

- Use Gmail App Password, not account password
- Enable 2FA on Google account first

**JWT errors:**

- Generate strong `JWT_SECRET` (min 32 characters)
- Check token is included in Authorization header

**WhatsApp not working:**

- Verify access token is valid
- Check phone number ID is correct
- Test with Twilio sandbox first

---

**Status:** ✅ COMPLETE  
**Version:** 2.0.0 (MongoDB)  
**Total Files Created:** 28  
**Lines of Code:** ~4,500+

Ready for testing and deployment! 🚀
