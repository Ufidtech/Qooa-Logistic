# 🔧 QOOA Backend Development Brief

> **For: Backend Developer**  
> **From: Frontend/Product Team**  
> **Date:** February 3, 2026  
> **Priority:** Pre-Pilot Launch

---

## 📋 **Current Status: What We Have**

### ✅ **Frontend (Fully Functional)**

- Dashboard UI with real-time updates
- Shipment tracking with quality status (Green/Orange/Red)
- Telemetry visualization (temperature, gas, humidity)
- Alert system UI
- Hub triage decision display
- SD card sync status indicators
- WhatsApp UX mockup (visual only)

### 📊 **Data Layer (Mock Data)**

- All shipment data is currently in `js/data.js` as JavaScript objects
- Telemetry history stored in-memory
- No database, no persistence across sessions
- Everything resets on page refresh

---

## 🎯 **What We Need You to Build**

### **Phase 1: Core Backend (2-3 Weeks)** 🔴 CRITICAL FOR PILOT

#### **1. Database Setup**

**Technology Choice:** PostgreSQL or MongoDB (Your recommendation?)

**Schema Required:**

```sql
-- Shipments Table
CREATE TABLE shipments (
    id VARCHAR(20) PRIMARY KEY,
    origin VARCHAR(255),
    destination VARCHAR(255),
    truck_id VARCHAR(20),
    driver_name VARCHAR(255),
    crate_count INT,
    crate_ids JSON,  -- Array of QR codes

    -- Hub Triage Data
    hub_gas_reading DECIMAL,
    hub_temperature DECIMAL,
    hub_humidity DECIMAL,
    field_heat_detected BOOLEAN,
    hub_triage_decision VARCHAR(50),  -- APPROVED, REJECTED, etc.
    hub_triage_timestamp TIMESTAMP,

    bio_shield_applied BOOLEAN,
    status VARCHAR(50),
    quality_status VARCHAR(20),  -- Green, Orange, Red

    departure_time TIMESTAMP,
    estimated_arrival TIMESTAMP,
    current_location VARCHAR(255),
    network_status VARCHAR(20),  -- online, offline

    -- SD Sync Status
    last_sync_time TIMESTAMP,
    pending_records INT,
    total_records_logged INT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Telemetry Table (Sensor Data)
CREATE TABLE telemetry (
    id SERIAL PRIMARY KEY,
    shipment_id VARCHAR(20) REFERENCES shipments(id),
    timestamp TIMESTAMP,

    -- Location Data
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location_name VARCHAR(255),

    -- Sensor Readings
    temperature DECIMAL(5, 2),
    humidity DECIMAL(5, 2),
    gas_level DECIMAL(6, 2),

    network_status VARCHAR(20),
    synced_at TIMESTAMP,  -- When data reached server

    created_at TIMESTAMP DEFAULT NOW()
);

-- Alerts Table
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    shipment_id VARCHAR(20) REFERENCES shipments(id),
    timestamp TIMESTAMP,
    type VARCHAR(50),  -- WARNING, OVERHEAT, etc.
    severity VARCHAR(20),  -- red, orange, yellow
    message TEXT,
    location VARCHAR(255),

    -- SMS Delivery
    sms_status VARCHAR(20),  -- sent, failed, pending
    driver_response VARCHAR(50),  -- acknowledged, null

    created_at TIMESTAMP DEFAULT NOW()
);

-- Users Table (For authentication)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),  -- bcrypt hashed
    name VARCHAR(255),
    role VARCHAR(50),  -- vendor, admin, driver
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

#### **2. REST API Endpoints**

**Base URL:** `https://api.qooa.ng/v1` (or localhost for development)

**Authentication:** JWT tokens (Bearer token in headers)

---

##### **A. Authentication Endpoints**

```
POST /api/auth/login
Request Body:
{
  "email": "mama.folake@mile12market.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "mama.folake@mile12market.com",
    "name": "Mama Folake",
    "role": "vendor"
  }
}
```

```
POST /api/auth/register
POST /api/auth/logout
GET /api/auth/me  (Returns current user info)
```

---

##### **B. Shipments Endpoints**

```
GET /api/shipments
Description: Get all shipments (with filters)
Query Params:
  - status=In Transit
  - quality_status=Green
  - limit=50
  - offset=0

Response:
{
  "success": true,
  "shipments": [
    {
      "id": "SHP-001",
      "origin": "Kano Agricultural Hub",
      "destination": "Oshodi Market, Lagos",
      "truck_id": "TRK-101",
      "quality_status": "Green",
      ... (all fields from database)
    }
  ],
  "total": 3
}
```

```
GET /api/shipments/:id
Description: Get single shipment with full telemetry history

Response:
{
  "success": true,
  "shipment": { ... },
  "telemetry": [
    {
      "timestamp": "2026-02-03T06:30:00Z",
      "temperature": 18.5,
      "gas_level": 52,
      ...
    }
  ],
  "alerts": [ ... ]
}
```

```
POST /api/shipments
Description: Create new shipment (order)
Request Body:
{
  "origin": "Kano Agricultural Hub",
  "destination": "Mile 12 Market, Lagos",
  "crate_count": 400,
  "bio_shield_applied": true
}

Response:
{
  "success": true,
  "shipment": {
    "id": "SHP-004",
    "truck_id": "TRK-245",
    "status": "Pending",
    ...
  }
}
```

```
PATCH /api/shipments/:id
Description: Update shipment (status, location, etc.)

PUT /api/shipments/:id/hub-triage
Description: Record hub triage results
Request Body:
{
  "gas_reading": 85,
  "temperature": 19.8,
  "humidity": 90,
  "field_heat_detected": false,
  "decision": "APPROVED"
}
```

---

##### **C. Telemetry Endpoints (IoT Device Data)**

```
POST /api/telemetry
Description: Receive sensor data from ESP32 truck device
Headers:
  Authorization: Bearer <device_token>
  X-Device-ID: TRK-101

Request Body:
{
  "shipment_id": "SHP-001",
  "timestamp": "2026-02-03T14:30:05Z",
  "latitude": 12.002,
  "longitude": 8.591,
  "temperature": 24.5,
  "humidity": 88,
  "gas_level": 115,
  "network_status": "online"
}

Response:
{
  "success": true,
  "message": "Telemetry recorded",
  "alert_triggered": false
}
```

```
POST /api/telemetry/bulk
Description: Upload multiple readings (for SD card sync after offline)
Request Body:
{
  "shipment_id": "SHP-001",
  "readings": [
    {
      "timestamp": "2026-02-03T13:00:00Z",
      "temperature": 19.5,
      ...
    },
    {
      "timestamp": "2026-02-03T13:15:00Z",
      "temperature": 19.8,
      ...
    }
  ]
}
```

---

##### **D. Alerts Endpoints**

```
GET /api/alerts
Description: Get all alerts (with filters)

GET /api/alerts/shipment/:shipmentId
Description: Get alerts for specific shipment

POST /api/alerts
Description: System-generated alert creation
Request Body:
{
  "shipment_id": "SHP-003",
  "type": "OVERHEAT",
  "severity": "red",
  "message": "Temperature exceeded 28°C",
  "location": "Ibadan Interchange"
}
```

---

##### **E. Statistics/Dashboard Endpoints**

```
GET /api/stats
Description: Dashboard summary stats

Response:
{
  "total_shipments": 3,
  "in_transit": 2,
  "bio_shield_active": 2,
  "completed": 0,
  "quality_breakdown": {
    "green": 2,
    "orange": 0,
    "red": 1
  }
}
```

---

#### **3. Real-Time Features**

**Option A: WebSockets (Recommended)**

```javascript
// Client connects to:
wss://api.qooa.ng/ws

// Server sends updates:
{
  "type": "TELEMETRY_UPDATE",
  "shipment_id": "SHP-001",
  "data": { temperature: 19.5, ... }
}

{
  "type": "ALERT_CREATED",
  "alert": { ... }
}

{
  "type": "SHIPMENT_STATUS_CHANGE",
  "shipment_id": "SHP-002",
  "new_status": "Completed"
}
```

**Option B: Server-Sent Events (SSE)**

```
GET /api/events (Keep connection open)
```

---

#### **4. Alert Logic (Backend Triggers)**

**When telemetry is received, check thresholds:**

```javascript
// Pseudo-code for alert system
function processTelemetry(data) {
  const { temperature, gas_level, humidity, shipment_id } = data;

  // Temperature alerts
  if (temperature > 28) {
    createAlert({
      shipment_id,
      type: "OVERHEAT",
      severity: "red",
      message: `CRITICAL: Temperature ${temperature}°C exceeds 28°C threshold`,
      trigger_sms: true, // Send SMS to driver
    });
  } else if (temperature >= 25 && temperature <= 28) {
    createAlert({
      shipment_id,
      type: "WARNING",
      severity: "orange",
      message: `Temperature approaching critical: ${temperature}°C`,
    });
  }

  // Gas alerts
  if (gas_level > 300) {
    createAlert({
      shipment_id,
      type: "GAS_CRITICAL",
      severity: "red",
      message: `Gas level ${gas_level} ppm indicates active fermentation`,
      trigger_sms: true,
    });
  }

  // Humidity alerts
  if (humidity < 70) {
    createAlert({
      shipment_id,
      type: "DEHYDRATION",
      severity: "red",
      message: "Humidity below 70% - cargo dehydration risk",
    });
  }
}
```

---

### **Phase 2: WhatsApp Integration (3-4 Weeks)** 🟡 POST-PILOT

#### **1. WhatsApp Business API Setup**

**Requirements:**

- Meta Business Account
- Verified business phone number
- WhatsApp Business API access (apply via Meta)

**Webhook Endpoint:**

```
POST /api/whatsapp/webhook
Description: Receive messages from WhatsApp
```

**Process Flow:**

1. Vendor sends: "Need 400 crates from Kano to Mile 12"
2. Backend receives message at webhook
3. Use NLP to extract: origin, destination, quantity
4. Create shipment via `POST /api/shipments`
5. Send WhatsApp confirmation with tracking link

**Libraries:**

- **Node.js:** `whatsapp-web.js` or official Meta SDK
- **Python:** `yowsup` or `twilio-python` (Twilio has WhatsApp API)

**Message Parser Example:**

```javascript
function parseOrderMessage(message) {
  // Extract numbers (quantity)
  const quantity = message.match(/(\d+)\s*crates?/i)?.[1];

  // Extract locations
  const origin = extractLocation(message, ["kano", "jos"]);
  const destination = extractLocation(message, ["lagos", "mile 12", "oshodi"]);

  // Check for bio-shield
  const bioShield = /bio-?shield/i.test(message);

  return { quantity, origin, destination, bioShield };
}
```

---

#### **2. SMS Alert System**

**For driver alerts (e.g., "OVERHEAT DETECTED")**

**Options:**

- **Twilio SMS API** (Easy, $0.0075/SMS in Nigeria)
- **Africa's Talking** (Africa-focused, cheaper)
- **Termii** (Nigerian provider)

**Implementation:**

```javascript
async function sendDriverAlert(alert) {
  const driver = await getDriverByShipment(alert.shipment_id);
  const message = `QOOA ALERT: ${alert.message}. Shipment ${alert.shipment_id}. Check ventilation immediately.`;

  await smsService.send({
    to: driver.phone,
    body: message,
  });

  // Update alert record
  await updateAlert(alert.id, { sms_status: "sent" });
}
```

---

### **Phase 3: IoT Device Integration (Parallel Development)** 🟢 HARDWARE TEAM

**You'll provide:**

- API documentation (endpoints above)
- Device authentication tokens
- Data format specifications

**Hardware team implements:**

- ESP32 firmware to call `POST /api/telemetry` every 15 minutes
- SD card logging when offline
- Bulk upload via `POST /api/telemetry/bulk` when reconnected

---

## 🔐 **Security Requirements**

1. **Password Hashing:** Use bcrypt (min 10 rounds)
2. **JWT Tokens:**
   - Access token: 1 hour expiry
   - Refresh token: 30 days expiry
3. **API Rate Limiting:** 100 requests/minute per user
4. **Device Authentication:** Separate tokens for ESP32 devices
5. **HTTPS Only:** No unencrypted connections
6. **CORS:** Whitelist frontend domains only

---

## 📦 **Recommended Tech Stack**

### **Option 1: Node.js** (Fast development, good for real-time)

- **Framework:** Express.js or Fastify
- **Database:** PostgreSQL with Sequelize ORM
- **Real-time:** Socket.io
- **Authentication:** Passport.js + JWT

### **Option 2: Python** (Great for data processing, ML future)

- **Framework:** FastAPI (async, fast)
- **Database:** PostgreSQL with SQLAlchemy
- **Real-time:** WebSockets via FastAPI
- **Authentication:** python-jose + passlib

### **Option 3: Go** (Best performance, harder to code)

- **Framework:** Gin or Fiber
- **Database:** PostgreSQL with GORM
- **Real-time:** Gorilla WebSocket

**My Recommendation:** **FastAPI (Python)** or **Express.js (Node.js)**

---

## 🚀 **Deployment**

### **For Demo/Pilot:**

- **Backend:** Railway.app or Render.com (Free tier works)
- **Database:** Railway PostgreSQL or Supabase (Free tier: 500MB)
- **Domain:** qooa.ng → Point API to api.qooa.ng

### **For Production:**

- **Backend:** AWS EC2, DigitalOcean, or Azure
- **Database:** Managed PostgreSQL (AWS RDS, Azure Database)
- **CDN:** Cloudflare (for frontend)

---

## 📅 **Development Timeline**

### **Week 1-2: Core Backend**

- [ ] Database setup + migrations
- [ ] User authentication (login/register)
- [ ] Shipments CRUD endpoints
- [ ] Basic telemetry endpoint

### **Week 3: Dashboard Integration**

- [ ] Connect frontend to API (replace mock data)
- [ ] Real-time updates (WebSocket)
- [ ] Alert system logic
- [ ] Testing with hardware team

### **Week 4-5: WhatsApp Integration**

- [ ] WhatsApp Business API setup
- [ ] Message parsing (NLP)
- [ ] Order creation from WhatsApp
- [ ] Confirmation messages

### **Week 6: SMS & Polish**

- [ ] SMS alert system (Twilio/Africa's Talking)
- [ ] Error handling
- [ ] API documentation (Swagger/Postman)
- [ ] Deployment

---

## 🧪 **Testing Requirements**

### **Unit Tests:**

- Alert threshold logic
- Message parsing
- Authentication

### **Integration Tests:**

- API endpoints (all CRUD operations)
- Telemetry processing
- Real-time updates

### **Load Testing:**

- 50 devices sending data every 15 minutes = 200 requests/hour
- Can system handle 1000 trucks = 4000 requests/hour?

---

## 📄 **Documentation You Need to Provide**

1. **API Documentation:** Swagger/OpenAPI spec or Postman collection
2. **Setup Guide:** How to run backend locally
3. **Environment Variables:** `.env.example` file
4. **Database Migrations:** Scripts to create/update schema
5. **Deployment Guide:** How to deploy to Railway/Render

---

## 🔗 **Frontend Integration Points**

**Current mock data location:** `js/data.js`

**What needs to change:**

1. Replace `shipments` array with API call: `GET /api/shipments`
2. Replace `getLatestTelemetry()` with API call: `GET /api/shipments/:id`
3. Add WebSocket connection for real-time updates
4. Replace `createNewOrder()` with: `POST /api/shipments`
5. Add JWT token storage in localStorage
6. Add API error handling

**Example API integration:**

```javascript
// Replace this (current):
const shipments = [ ... ];

// With this (API version):
async function fetchShipments() {
  const token = localStorage.getItem('auth_token');
  const response = await fetch('https://api.qooa.ng/v1/shipments', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data.shipments;
}
```

---

## ❓ **Questions for Backend Developer**

Please answer these before starting:

1. **Tech Stack Preference:** Node.js, Python, or Go?
2. **Database Choice:** PostgreSQL or MongoDB?
3. **Hosting Platform:** Railway, Render, AWS, or other?
4. **Real-time Approach:** WebSocket, SSE, or polling?
5. **Timeline:** Can you commit to 4-6 weeks part-time?
6. **Previous Experience:** Built APIs with real-time features before?

---

## 📞 **Communication**

**Daily Standups:** What we need to know

- What you built yesterday
- What you're building today
- Any blockers (API design questions, data format issues)

**Weekly Demos:** Show us working endpoints (use Postman)

---

## 🎯 **Priority Order**

1. **CRITICAL (Week 1-2):** Auth + Shipments + Telemetry APIs
2. **IMPORTANT (Week 3):** WebSocket + Alert logic
3. **NICE TO HAVE (Week 4+):** WhatsApp + SMS

**For your competition demo, you only need #1 and #2.**

---

## 📧 **Next Steps**

**Send this document to backend developer and ask:**

1. "Can you build this?"
2. "Which tech stack do you prefer?"
3. "What's your timeline estimate?"
4. "Do you have questions about any endpoint?"
5. "Can you start with database schema + auth this week?"

**Once they confirm, create a shared Notion/Trello board to track progress.**

---

**Built with 🍅 by QOOA Team**  
_Good luck with the backend build!_
