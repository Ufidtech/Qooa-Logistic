# QOOA System Workflow & Demo Guide 🍅

> **Complete Technical Documentation: Software + Hardware Integration**

---

## 📋 Table of Contents

1. [Software Workflow](#software-workflow)
2. [Hardware Workflow](#hardware-workflow)
3. [System Thresholds](#system-thresholds)
4. [Demo Guide](#demo-guide)
5. [Technical Implementation Details](#technical-implementation-details)

---

## 🖥️ SOFTWARE WORKFLOW

### **Project Overview**

QOOA is a **logistics control tower dashboard** for tracking perishable goods (tomatoes) from Northern Nigeria (Kano/Jos) to Lagos. The platform reduces the 45-50% post-harvest loss by monitoring shipments in real-time.

### **Technology Stack**

- Pure HTML/CSS/JavaScript (no frameworks)
- Client-side only (localStorage for sessions)
- Ready for IoT integration (ESP32 sensor references)

---

### **User Flow: Step-by-Step**

#### **1. User Authentication** ([index.html](index.html))

- Vendors log in via email/password form
- Session stored in `localStorage`
- Auto-redirects authenticated users to dashboard
- **Key Feature:** Already logged-in users skip login screen

#### **2. Dashboard Control Tower** ([dashboard.html](dashboard.html))

- **Stats Overview:**
  - Total shipments
  - In-transit count
  - Bio-shield active count
  - Completed shipments
- **Shipment List:** Live shipments with color-coded status badges
  - 🟢 **Green:** Safe quality levels
  - 🟠 **Orange:** Warning - requires attention
  - 🔴 **Red:** Critical - immediate action needed
- **Sidebar Navigation:**
  - Dashboard (Overview)
  - Shipments (Detailed tracking)
  - Live Telemetry (IoT sensor data)
  - Reports (Analytics)
  - Settings (Configuration)

**💬 WhatsApp Integration:**

- Vendors place orders via WhatsApp Business API
- Orders automatically populate in dashboard
- Confirmations and alerts sent via WhatsApp
- **Zero app downloads required** — works on basic smartphones

#### **3. Data Layer** ([js/data.js](js/data.js))

- **Mock Shipments:** 3 sample shipments with different quality statuses
- **Telemetry Database:** Historical sensor readings
  - Temperature monitoring
  - Gas levels (ethanol detection)
  - Humidity tracking
  - GPS location history
- **"Lokoja Gap" Feature:** Simulates offline zones where network drops out
  - Demonstrates offline-first architecture
  - Shows last known data when network unavailable

#### **4. Business Logic** ([js/dashboard.js](js/dashboard.js))

- Renders shipments dynamically
- Calculates real-time statistics
- Handles new order creation
- Opens telemetry modals with IoT sensor data visualization
- Session management & logout functionality
- Quality status determination based on sensor thresholds

#### **5. Utilities** ([js/utils.js](js/utils.js))

- Date/time formatting for timestamps
- Telemetry data access helpers
- Status calculation functions

---

### **Key Software Features**

✅ **Quality Status Monitoring** - Green/Orange/Red based on gas (ethanol) & temperature thresholds  
✅ **Bio-Shield Tracking** - Identifies which shipments have protective coating applied  
✅ **Offline-First Architecture** - "Lokoja Gap" simulates areas without network coverage  
✅ **Real-Time Dashboard** - Updates stats and shipments dynamically  
✅ **WhatsApp Business Integration** - Zero-friction ordering via Africa's #1 business tool  
✅ **Session Management** - Secure vendor authentication and authorization  
✅ **Responsive Design** - Works on desktop and mobile devices

---

## 🔧 HARDWARE WORKFLOW

The hardware system consists of two main components:

1. **Hub Device** (Quality Triage at Origin)
2. **Truck Device** (In-Transit Monitoring)

---

### **Step 1: The Hub Triage (The "Sorting Gate")**

**Hardware:** Hub Device (ESP32, MQ-3, DHT11, LCD, Red/Green LEDs)

**Action:**

1. Tomatoes are poured into the soft-lined container
2. Lid is closed
3. **Wait Time:** 60 seconds (allows sensors to stabilize and "micro-climate" to form)

**Thresholds & Decision Logic:**

- **Temperature:**
  - If $> 25°C$, the LCD displays **"EXTRACT HEAT"** (Field heat is present)

- **Gas (MQ-3 Ethanol Sensor):**
  - **$< 100\text{ ppm}$:** 🟢 **GREEN LED** – High Quality / Low Fermentation  
    → Proceed to Bio-Shield + Lagos Transit
  - **$100-300\text{ ppm}$:** 🟠 **ORANGE (LCD only)** – Moderate Ripening  
    → Short-haul delivery only
  - **$> 300\text{ ppm}$:** 🔴 **RED LED** – High Ethanol/Ethylene  
    → **DO NOT SHIP.** Sell to local processors immediately

**Data Logging:**

- Device saves final reading to SD Card (offline backup)
- Syncs to Cloud via Hub Wi-Fi or GSM when network available

---

### **Step 2: Processing (Bio-Shield & Crating)**

**Hardware:** Digital Scanner (or Phone with QR App)

**Action:**

1. Pass "Green Light" tomatoes through the Bio-Shield sprayer
2. Once air-dried, pack them into Vented RPC Crates
3. Hub Manager scans the Crate ID and links it to Batch Data from Step 1

---

### **Step 3: Transit (The "Night-Flight" Monitor)**

**Hardware:** Truck Device (ESP32, MQ-3, DHT11, SIM800L, Neo-6M GPS, SD Module)

**Action:** Device is switched on and secured inside truck cargo area

**Operations:**

#### **1. Continuous Monitoring**

- Every 15 minutes, device wakes up
- Takes GPS fix
- Reads sensors (temperature, humidity, gas)

#### **2. The "Safety Sync"**

- **Network OK:** Data sent immediately to Cloud
- **No Network:** Data logged to SD Card with timestamp and GPS coordinates

#### **3. Active Alerts (Edge Logic)**

If conditions exceed thresholds:

- **Temp spike above $28°C$** OR
- **Gas spike above $400\text{ ppm}$** (rot outbreak mid-transit)

**Action:** SIM800L sends Emergency SMS to driver:

> _"OVERHEAT DETECTED. CHECK VENTILATION NOW."_

---

### **Step 4: Arrival & Verification (The "Proof of Quality")**

**Action:** Upon arrival in Lagos, Hub/Warehouse manager scans the crate

**Outcome:** Admin Portal generates **Freshness Report** combining:

- Hub Entry Data (The Triage score)
- Transit Logs (Proof temperature never exceeded safe range)

**Value:** Show this report to B2B customers to justify premium pricing

---

## 📊 SYSTEM THRESHOLDS

Use these constants in your code:

| Metric                | Safe Range (Green) | Warning Range (Orange)            | Danger Range (Red)    |
| --------------------- | ------------------ | --------------------------------- | --------------------- |
| **Temperature**       | $12°C - 20°C$      | $21°C - 27°C$                     | $> 28°C$              |
| **Ethanol (MQ-3)**    | $< 100\text{ ppm}$ | $100\text{ ppm} - 300\text{ ppm}$ | $> 300\text{ ppm}$    |
| **Relative Humidity** | $85\% - 95\%$      | $70\% - 84\%$                     | $< 70\%$ (Drying out) |

---

### **Hardware-Specific Thresholds**

For LED indicators and immediate decision-making:

| Metric          | GREEN (Good)     | RED (Action Needed)               |
| --------------- | ---------------- | --------------------------------- |
| **Temperature** | $12°C$ to $22°C$ | $> 26°C$ (Accelerated Rot)        |
| **MQ-3 Gas**    | $< 150$ ppm      | $> 300$ ppm (Active Fermentation) |
| **Humidity**    | $85\%$ to $95\%$ | $< 70\%$ (Shrinking/Weight Loss)  |

---

## 🎯 DEMO GUIDE

### **Key Functional Parts to Demonstrate**

#### **Part 1: Login & Authentication**

1. Open [index.html](index.html)
2. Enter any email/password
3. Show auto-redirect to dashboard
4. Demonstrate session persistence (refresh page → stays logged in)

#### **Part 2: Dashboard Overview**

1. Point out the 4 key statistics at the top
2. Show the sidebar navigation
3. Explain the "Control Tower" concept

#### **Part 3: Quality Status System**

Walk through each shipment type:

**🟢 Green Shipment (SHP-002):**

- "Jos to Lagos, everything optimal"
- Gas: 85 ppm (below 100 ppm threshold)
- Temp: 19.8°C (ideal range)
- Bio-Shield applied

**🔴 Red Shipment (SHP-003):**

- "Kano to Lagos, critical situation"
- Gas: 320 ppm (above 300 ppm danger threshold)
- Temp: 29.2°C (above 28°C critical)
- NO Bio-Shield applied
- "This cargo would be rejected or sold locally"

#### **Part 4: The "Lokoja Gap" Feature**

1. Click on **SHP-001** (First shipment)
2. Show "Network: Offline" indicator
3. Explain: "This truck is in a network dead zone"
4. Point out "Last Known Location: Lokoja Junction"
5. Explain the SD Card backup system:
   - "Device continues logging to SD card"
   - "Data syncs automatically when signal returns"
   - "No data loss in dead zones"

#### **Part 4.5: WhatsApp Business Integration** 🆕

**The Game-Changer for African Markets:**

1. **Explain the Context:**
   - "In Nigeria, 78% of business transactions happen on WhatsApp"
   - "App download rates are only 12%"
   - "Market vendors use ₦15,000 basic phones"
   - "We meet them where they are"

2. **Show the WhatsApp Flow (Pull out phone or show mockup):**

   ```
   Vendor → QOOA WhatsApp
   "Hi, I need 400 crates from Kano to Mile 12. With Bio-Shield."

   QOOA → Vendor
   "✅ Order confirmed!
   Shipment ID: SHP-004
   Truck: TRK-245
   Estimated delivery: Thursday 3pm
   Track here: qooa.ng/track/SHP-004"
   ```

3. **Show Backend (Click ➕ New Order):**
   - "This is what happens automatically behind the scenes"
   - "WhatsApp Business API extracts: origin, destination, quantity"
   - "System creates order, assigns truck, generates QR codes"
   - "Vendor gets confirmation — all via WhatsApp"

4. **Key Benefits:**
   - ✅ Zero app downloads
   - ✅ Works on basic smartphones
   - ✅ Voice message support (for illiterate users)
   - ✅ 180 million Africans already trained
   - ✅ Real-time order status updates via chat

#### **Part 5: Live Telemetry Modal**

1. Click any shipment card
2. Show the telemetry modal with:
   - Temperature graph
   - Gas level readings
   - GPS location history
   - Network status indicator
3. Explain how this connects to ESP32 hardware

#### **Part 6: New Order Creation (WhatsApp Backend View)**

1. Click "➕ New Order" button
2. **Emphasize:** "Vendors never see this — they just WhatsApp us"
3. Fill out the form (showing what happens automatically):
   - Origin (e.g., "Kano Agricultural Hub")
   - Destination (e.g., "Mile 12 Market, Lagos")
   - Crate count (e.g., 400)
4. Submit and watch new shipment appear instantly
5. Show updated statistics
6. **Reinforce:** "All this happens behind the scenes when a WhatsApp message arrives"

#### **Part 7: Logout & Security**

2. Show the telemetry modal with:
   - Temperature graph
   - Gas level readings
   - GPS location history
   - Network status indicator
3. Explain how this connects to ESP32 hardware

#### **Part 6: New Order Creation**

1. Click "➕ New Order" button
2. Fill out the form:
   - Origin (e.g., "Kano Agricultural Hub")
   - Destination (e.g., "Mile 12 Market, Lagos")
   - Crate count (e.g., 400)
3. Submit and watch new shipment appear instantly
4. Show updated statistics

#### **Part 7: Logout & Security**

1. Click logout button in sidebar
2. Show redirect to login page
3. Try accessing dashboard directly → forced back to login

---

## 🛠️ TECHNICAL IMPLEMENTATION DETAILS

### **The "Standard" Logic**

By logging to the SD card in the truck, you solve the **"Lokoja Gap"** (the common network dead zone between North and South Nigeria). Even if you don't see the truck on your map for 2 hours, you will get the full history of the tomatoes' health once they reach the next 3G/4G tower.

---

### **Serial Log Format**

#### **1. SD Card Log Format (CSV)**

Ask your software developer to make the ESP32 create a file named `LOG.CSV`. Each line should look like this:

```
Timestamp, DeviceID, Lat, Long, Temp, Humidity, GasPPM, Status
```

**Example of raw data on SD Card:**

```csv
2026-02-01 14:30:05, TRUCK_01, 12.002, 8.591, 24.5, 88, 115, OK
2026-02-01 14:45:05, TRUCK_01, 11.850, 8.420, 26.1, 85, 128, WARNING
2026-02-01 15:00:05, TRUCK_01, 11.720, 8.310, 28.4, 82, 310, DANGER
```

**Why this format?**  
Even if the network cuts out for 10 hours, when the device finally "syncs," the Admin Portal can reconstruct the exact map of where the tomatoes started to overheat.

---

#### **2. MQ-3 Sensor Calibration**

**Code Tip:** The MQ-3 doesn't give "PPM" automatically; it gives a voltage (0-4095 on ESP32). Tell your software developer to use a calibration loop in the first 60 seconds to set the "Clean Air" baseline.

---

#### **3. The "Smart Sync" Strategy**

Since you are working on the hardware, here's how you handle SD-to-Cloud sync:

1. **The "Live" Attempt:** Every 15 mins, device tries to send current reading to portal via SIM800L
2. **The "Backup" Action:** Whether send succeeds or fails, data always gets written to SD card
3. **The "Sync" Action:** Once every 4 hours (or when signal strength is "High"), device checks a "Sync Flag" and sends all missing rows from SD card to portal in one batch

---

### **Physical Protection (The "Nigerian Road" Factor)**

Since you're building the prototype now, remember: **Trucks are violent.**

#### **SD Card Slot Protection**

- Use electrical tape over the SD card slot
- Vibrations can cause the card to "pop out" mid-journey on Nigerian roads

#### **Inner Lining for Hub Device**

- Use **Food-Grade Silicone** or **Polyethylene foam** (white soft foam)
- **Avoid** open-cell sponges: they soak up tomato juice and grow mold
- Mold will mess up your MQ-3 readings

---

## 🚀 Integration Points

### **Software ↔ Hardware Connection**

The dashboard is ready to receive data from your ESP32 devices via:

1. **REST API Endpoints** (to be implemented):
   - `POST /api/telemetry` - Receive sensor data from trucks
   - `POST /api/hub-triage` - Receive hub quality assessment
   - `GET /api/shipments/{id}` - Retrieve shipment details

2. **WhatsApp Business API Integration**:
   - `POST /api/whatsapp/orders` - Receive orders from vendors via WhatsApp
   - `POST /api/whatsapp/alerts` - Send real-time alerts to vendors
   - Natural Language Processing to extract: origin, destination, quantity, preferences
   - Voice message support via speech-to-text
   - **Vendor Interface:** Simple WhatsApp messages (e.g., "Need 400 crates from Kano")
   - **System Response:** Automated confirmations with shipment ID and tracking link

3. **WebSocket Connection** (future):
   - Real-time telemetry updates
   - Live GPS tracking
   - Instant alert notifications

4. **SD Card Data Import**:
   - Bulk upload CSV files from trucks after "Lokoja Gap"
   - Backfill missing data automatically
   - Maintain complete audit trail

---

## 📈 Success Metrics

**What This System Achieves:**

✅ **Visibility:** Real-time tracking from farm to market  
✅ **Quality Assurance:** Objective, data-driven quality scoring  
✅ **Traceability:** Complete audit trail for every crate  
✅ **Loss Prevention:** Early warning system for cargo spoilage  
✅ **Premium Pricing:** Proof of quality justifies higher prices  
✅ **Network Resilience:** Works in offline zones with SD backup

---

## 🔐 Security Considerations

- **Authentication:** Session-based login (ready for JWT upgrade)
- **Data Privacy:** Vendor-specific shipment access
- **Hardware Security:** Device-specific API keys for telemetry uploads
- **Audit Trail:** All quality decisions logged with timestamps

---

## 📞 Support & Next Steps

**Current Status:** ✅ High-Fidelity MVP Ready for Hardware Integration

**Next Development Phase:**

1. Backend API development (Node.js/Python)
2. Database setup (PostgreSQL/MongoDB)
3. ESP32 firmware development
4. Field testing with 3-5 trucks
5. B2B customer pilot program

---

**Built with 🍅 by QOOA Team**  
_Empowering Farmers. Stabilizing Prices. Eliminating Waste._
