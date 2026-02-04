# QOOA Vendor Portal - Backend API Documentation

## Overview

This document describes the backend API architecture for the QOOA Vendor Portal system. The backend manages vendor registration, ordering, real-time tracking, payments, and quality feedback.

---

## Technology Stack

### Recommended Stack:

- **Runtime**: Node.js with Express.js OR Python with Flask/FastAPI
- **Database**: PostgreSQL (primary) + Redis (caching & real-time)
- **Storage**: AWS S3 or Cloudinary (damage photos)
- **Payment**: Paystack API / Monnify API
- **Real-time**: Socket.IO or WebSocket
- **SMS**: Termii or Africa's Talking
- **Price Source**: Google Sheets API (for MVP) → Database (production)

---

## Database Schema

### 1. Vendors Table

```sql
CREATE TABLE vendors (
    vendor_id VARCHAR(20) PRIMARY KEY,
    vendor_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    market_cluster VARCHAR(100) NOT NULL,
    other_market VARCHAR(255),
    stall_number VARCHAR(100) NOT NULL,
    business_type VARCHAR(50) NOT NULL,
    typical_order_size VARCHAR(20),
    language_preference VARCHAR(10) DEFAULT 'en',
    status VARCHAR(20) DEFAULT 'active',
    quality_score DECIMAL(3,2) DEFAULT 5.0,
    total_orders INT DEFAULT 0,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vendors_phone ON vendors(phone_number);
CREATE INDEX idx_vendors_market ON vendors(market_cluster);
```

### 2. Orders Table

```sql
CREATE TABLE orders (
    order_id VARCHAR(20) PRIMARY KEY,
    vendor_id VARCHAR(20) REFERENCES vendors(vendor_id),
    crate_quantity INT NOT NULL,
    price_per_crate DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    delivery_date DATE NOT NULL,
    delivery_time VARCHAR(20) NOT NULL,
    status VARCHAR(30) DEFAULT 'confirmed',
    payment_status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(50),
    transaction_reference VARCHAR(100),
    truck_id VARCHAR(20),
    driver_name VARCHAR(255),
    driver_phone VARCHAR(20),
    ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_vendor ON orders(vendor_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(delivery_date);
```

### 3. Order Tracking Table

```sql
CREATE TABLE order_tracking (
    tracking_id SERIAL PRIMARY KEY,
    order_id VARCHAR(20) REFERENCES orders(order_id),
    stage VARCHAR(30) NOT NULL,
    location VARCHAR(255),
    notes TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50)
);

CREATE INDEX idx_tracking_order ON order_tracking(order_id);
```

### 4. IoT Telemetry Table

```sql
CREATE TABLE telemetry_data (
    telemetry_id SERIAL PRIMARY KEY,
    order_id VARCHAR(20) REFERENCES orders(order_id),
    truck_id VARCHAR(20),
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    gas_level INT,
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    battery_level INT,
    recorded_at TIMESTAMP NOT NULL,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_telemetry_order ON telemetry_data(order_id);
CREATE INDEX idx_telemetry_truck ON telemetry_data(truck_id);
CREATE INDEX idx_telemetry_time ON telemetry_data(recorded_at);
```

### 5. Subscriptions Table

```sql
CREATE TABLE subscriptions (
    subscription_id SERIAL PRIMARY KEY,
    vendor_id VARCHAR(20) REFERENCES vendors(vendor_id),
    crate_quantity INT NOT NULL,
    frequency VARCHAR(20) NOT NULL, -- 'monday', 'tuesday', etc.
    delivery_time VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    start_date DATE NOT NULL,
    end_date DATE,
    next_order_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_vendor ON subscriptions(vendor_id);
CREATE INDEX idx_subscriptions_next_order ON subscriptions(next_order_date);
```

### 6. Feedback Table

```sql
CREATE TABLE feedback (
    feedback_id SERIAL PRIMARY KEY,
    order_id VARCHAR(20) REFERENCES orders(order_id),
    vendor_id VARCHAR(20) REFERENCES vendors(vendor_id),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    has_damage_report BOOLEAN DEFAULT FALSE,
    damage_photo_url VARCHAR(500),
    refund_amount DECIMAL(10,2),
    refund_status VARCHAR(20),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feedback_order ON feedback(order_id);
CREATE INDEX idx_feedback_vendor ON feedback(vendor_id);
```

### 7. Pricing Table

```sql
CREATE TABLE pricing (
    price_id SERIAL PRIMARY KEY,
    price_per_crate DECIMAL(10,2) NOT NULL,
    effective_from TIMESTAMP NOT NULL,
    effective_to TIMESTAMP,
    market_factor DECIMAL(5,4) DEFAULT 1.0,
    notes TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pricing_effective ON pricing(effective_from, effective_to);
```

### 8. Admin Broadcasts Table

```sql
CREATE TABLE broadcasts (
    broadcast_id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    message_pidgin TEXT,
    target_market VARCHAR(100), -- NULL means all markets
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_by VARCHAR(100)
);
```

---

## API Endpoints

### Authentication & Vendor Management

#### POST /api/vendors/register

Register a new vendor

```json
Request:
{
  "vendorName": "Mama Chinedu Foods",
  "phoneNumber": "+234XXXXXXXXXX",
  "email": "vendor@example.com",
  "marketCluster": "mile12",
  "stallNumber": "Shop 45",
  "businessType": "mama-put",
  "orderSize": "3-5",
  "language": "en"
}

Response:
{
  "success": true,
  "vendorId": "VEN12345678",
  "message": "Registration successful",
  "smsToken": "123456"
}
```

#### POST /api/vendors/login

Authenticate vendor (SMS-based OTP or password)

```json
Request:
{
  "phoneNumber": "+234XXXXXXXXXX",
  "otp": "123456"
}

Response:
{
  "success": true,
  "token": "jwt_token_here",
  "vendor": {
    "vendorId": "VEN12345678",
    "vendorName": "Mama Chinedu Foods",
    "marketCluster": "mile12",
    "qualityScore": 5.0
  }
}
```

#### GET /api/vendors/profile

Get vendor profile (requires authentication)

```json
Response:
{
  "vendorId": "VEN12345678",
  "vendorName": "Mama Chinedu Foods",
  "phoneNumber": "+234XXXXXXXXXX",
  "email": "vendor@example.com",
  "marketCluster": "mile12",
  "stallNumber": "Shop 45",
  "businessType": "mama-put",
  "qualityScore": 4.8,
  "totalOrders": 24,
  "registeredAt": "2026-01-15T10:00:00Z"
}
```

---

### Pricing

#### GET /api/pricing/current

Get current crate price

```json
Response:
{
  "price": 18500,
  "currency": "NGN",
  "lastUpdated": "2026-02-03T08:00:00Z",
  "trend": "stable",
  "effectiveFrom": "2026-02-01T00:00:00Z"
}
```

#### GET /api/pricing/history

Get price history (admin)

```json
Response:
{
  "prices": [
    {
      "price": 18500,
      "effectiveFrom": "2026-02-01T00:00:00Z",
      "effectiveTo": null
    },
    {
      "price": 17800,
      "effectiveFrom": "2026-01-15T00:00:00Z",
      "effectiveTo": "2026-01-31T23:59:59Z"
    }
  ]
}
```

---

### Orders

#### POST /api/orders/create

Place a new order

```json
Request:
{
  "crateQuantity": 5,
  "deliveryDate": "2026-02-05",
  "deliveryTime": "morning"
}

Response:
{
  "success": true,
  "order": {
    "orderId": "ORD87654321",
    "crateQuantity": 5,
    "pricePerCrate": 18500,
    "totalAmount": 92500,
    "deliveryDate": "2026-02-05",
    "status": "confirmed",
    "paymentStatus": "pending"
  },
  "paymentLink": "https://paystack.com/pay/xxxxx"
}
```

#### GET /api/orders/vendor

Get all orders for authenticated vendor

```json
Response:
{
  "orders": [
    {
      "orderId": "ORD87654321",
      "crateQuantity": 5,
      "totalAmount": 92500,
      "deliveryDate": "2026-02-05",
      "status": "in-transit",
      "paymentStatus": "completed",
      "orderedAt": "2026-02-03T10:30:00Z"
    }
  ]
}
```

#### GET /api/orders/:orderId

Get specific order details

```json
Response:
{
  "orderId": "ORD87654321",
  "vendorId": "VEN12345678",
  "crateQuantity": 5,
  "pricePerCrate": 18500,
  "totalAmount": 92500,
  "deliveryDate": "2026-02-05",
  "deliveryTime": "morning",
  "status": "in-transit",
  "paymentStatus": "completed",
  "truckId": "TRK-KN-001",
  "driverName": "Musa Ibrahim",
  "driverPhone": "+234XXXXXXXXXX",
  "tracking": [
    {
      "stage": "confirmed",
      "timestamp": "2026-02-03T10:30:00Z"
    },
    {
      "stage": "in-transit",
      "location": "Kano State",
      "timestamp": "2026-02-03T14:00:00Z"
    }
  ],
  "telemetry": {
    "avgTemp": 24.5,
    "maxTemp": 27.8,
    "minTemp": 22.1,
    "freshnessScore": 95
  }
}
```

---

### Subscriptions

#### POST /api/subscriptions/create

Create a subscription

```json
Request:
{
  "crateQuantity": 2,
  "frequency": "tuesday",
  "deliveryTime": "morning"
}

Response:
{
  "success": true,
  "subscription": {
    "subscriptionId": 1,
    "crateQuantity": 2,
    "frequency": "tuesday",
    "nextOrderDate": "2026-02-04",
    "status": "active"
  }
}
```

#### GET /api/subscriptions/vendor

Get vendor's subscription

```json
Response:
{
  "subscription": {
    "subscriptionId": 1,
    "crateQuantity": 2,
    "frequency": "tuesday",
    "deliveryTime": "morning",
    "nextOrderDate": "2026-02-04",
    "status": "active"
  }
}
```

#### DELETE /api/subscriptions/:id

Cancel subscription

```json
Response:
{
  "success": true,
  "message": "Subscription cancelled"
}
```

---

### Tracking & Telemetry

#### GET /api/tracking/:orderId

Get real-time tracking for an order

```json
Response:
{
  "orderId": "ORD87654321",
  "currentStatus": "in-transit",
  "currentLocation": "Kaduna State",
  "estimatedArrival": "2026-02-04T16:00:00Z",
  "stages": [
    {
      "stage": "confirmed",
      "completed": true,
      "timestamp": "2026-02-03T10:30:00Z"
    },
    {
      "stage": "in-transit",
      "completed": true,
      "location": "Kano → Lagos",
      "timestamp": "2026-02-03T14:00:00Z"
    }
  ],
  "telemetry": {
    "temperature": 24.5,
    "humidity": 65,
    "gasLevel": 45,
    "lastUpdate": "2026-02-03T18:45:00Z"
  }
}
```

#### WebSocket: /ws/tracking/:orderId

Real-time updates via WebSocket

```javascript
// Client connects to: ws://api.qooa.com/ws/tracking/ORD87654321
// Server sends updates:
{
  "type": "telemetry_update",
  "orderId": "ORD87654321",
  "temperature": 25.1,
  "location": { "lat": 9.0820, "lng": 8.6753 },
  "timestamp": "2026-02-03T19:00:00Z"
}

{
  "type": "status_update",
  "orderId": "ORD87654321",
  "status": "at-hub",
  "location": "Lagos Distribution Hub",
  "timestamp": "2026-02-04T06:30:00Z"
}
```

---

### Payments

#### POST /api/payments/initiate

Initiate Paystack payment

```json
Request:
{
  "orderId": "ORD87654321",
  "amount": 92500
}

Response:
{
  "success": true,
  "authorizationUrl": "https://checkout.paystack.com/xxxxx",
  "accessCode": "xxxxx",
  "reference": "PAY_xxxxx"
}
```

#### POST /api/payments/webhook

Paystack webhook (server-to-server)

```json
Request (from Paystack):
{
  "event": "charge.success",
  "data": {
    "reference": "PAY_xxxxx",
    "amount": 9250000,
    "status": "success",
    "metadata": {
      "orderId": "ORD87654321"
    }
  }
}
```

#### POST /api/payments/bank-transfer

Confirm bank transfer

```json
Request:
{
  "orderId": "ORD87654321",
  "reference": "ORD87654321",
  "amount": 92500
}

Response:
{
  "success": true,
  "message": "Transfer noted. Verification pending."
}
```

---

### Feedback

#### POST /api/feedback/submit

Submit order feedback

```json
Request (multipart/form-data):
{
  "orderId": "ORD87654321",
  "rating": 5,
  "comments": "Fresh tomatoes, great quality!",
  "damagePhoto": <file>
}

Response:
{
  "success": true,
  "feedback": {
    "feedbackId": 123,
    "rating": 5,
    "refundStatus": null
  }
}
```

#### GET /api/feedback/vendor

Get vendor's feedback history

```json
Response:
{
  "averageRating": 4.8,
  "totalFeedback": 24,
  "feedback": [
    {
      "feedbackId": 123,
      "orderId": "ORD87654321",
      "rating": 5,
      "comments": "Fresh tomatoes, great quality!",
      "submittedAt": "2026-02-04T20:00:00Z"
    }
  ]
}
```

---

### Admin / Broadcast

#### POST /api/admin/broadcast

Send broadcast message to vendors

```json
Request:
{
  "message": "New batch arriving from Kano tomorrow! Pre-order now at ₦18,000",
  "messagePidgin": "Fresh tomato dey come tomorrow from Kano! Order now for ₦18,000",
  "targetMarket": null  // null = all markets, or "mile12", etc.
}

Response:
{
  "success": true,
  "recipientCount": 150,
  "messageId": "BCAST_12345"
}
```

#### GET /api/admin/inventory

Get inventory status

```json
Response:
{
  "currentStock": 500,
  "pendingOrders": 200,
  "availableStock": 300,
  "nextDelivery": {
    "date": "2026-02-05",
    "quantity": 1000
  },
  "alert": "low_stock"
}
```

---

## Real-Time Features

### Socket.IO Events

#### Client → Server:

- `join_order`: Join order tracking room
- `leave_order`: Leave order tracking room

#### Server → Client:

- `order_status_update`: Order status changed
- `telemetry_update`: IoT data update
- `price_update`: Price changed
- `broadcast_message`: Admin broadcast

---

## Security

1. **Authentication**: JWT tokens with 7-day expiry
2. **Rate Limiting**: 100 requests per 15 minutes per IP
3. **Input Validation**: Sanitize all inputs
4. **SQL Injection Protection**: Use parameterized queries
5. **CORS**: Restrict to frontend domain only
6. **HTTPS**: Enforce SSL/TLS
7. **API Keys**: Separate keys for Paystack, SMS, Google Sheets

---

## Deployment

### Recommended Infrastructure:

- **API Server**: AWS EC2 / DigitalOcean / Heroku
- **Database**: AWS RDS PostgreSQL / Managed PostgreSQL
- **Redis**: AWS ElastiCache / Redis Cloud
- **File Storage**: AWS S3 / Cloudinary
- **CDN**: CloudFlare
- **Monitoring**: Sentry + DataDog

### Environment Variables:

```env
DATABASE_URL=postgresql://user:pass@host:5432/qooa
REDIS_URL=redis://host:6379
JWT_SECRET=your_secret_key
PAYSTACK_SECRET_KEY=sk_live_xxxxx
PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
SMS_API_KEY=your_sms_api_key
GOOGLE_SHEETS_API_KEY=your_sheets_key
AWS_S3_BUCKET=qooa-uploads
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
FRONTEND_URL=https://vendor.qooa.com
```

---

## Testing

### Unit Tests:

- Vendor registration
- Order creation
- Price calculation
- Payment processing

### Integration Tests:

- End-to-end order flow
- Payment webhook handling
- Real-time tracking updates

### Load Tests:

- 1000 concurrent vendors
- 100 orders per minute
- WebSocket scalability

---

## Monitoring & Alerts

### Key Metrics:

- API response times
- Order success rate
- Payment success rate
- Database connection pool
- Redis cache hit rate
- WebSocket connections

### Alerts:

- API downtime > 1 minute
- Database errors
- Payment failures > 5%
- Low inventory (< 100 crates)
- IoT data gaps > 30 minutes

---

## Next Steps

1. Set up PostgreSQL database with schema
2. Implement vendor registration API
3. Integrate Paystack for payments
4. Set up WebSocket for real-time tracking
5. Implement SMS notifications
6. Connect IoT telemetry data stream
7. Build admin dashboard
8. Deploy to staging environment
9. Load testing
10. Production deployment

---

## Support

For backend development support:

- Email: dev@qooa.com
- Slack: #qooa-backend
- Documentation: https://docs.qooa.com
