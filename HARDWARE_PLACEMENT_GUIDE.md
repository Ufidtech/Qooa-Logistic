# QOOA Hardware Placement & IoT Strategy

## Overview

This document outlines the hardware placement strategy for the QOOA Quality Assurance System. The IoT sensors monitor temperature, humidity, and gas levels (ethanol from fermentation) to ensure tomato freshness throughout the supply chain.

---

## Hardware Components

### 1. **Mobile Sensor Node (In-Transit Monitoring)**

**Purpose**: Monitor produce quality during transportation from Northern farms to Southern markets

**Components**:

- **Microcontroller**: ESP32 (WiFi/Bluetooth, low power)
- **Temperature Sensor**: DHT22 (accuracy ±0.5°C)
- **Humidity Sensor**: DHT22 (integrated)
- **Gas Sensor**: MQ-3 (ethanol/alcohol vapor detection)
- **GPS Module**: NEO-6M (location tracking)
- **SD Card Module**: Data logging during network dead zones
- **Power**: 10,000mAh battery bank + solar panel (optional)
- **Enclosure**: Waterproof IP65 case

**Cost**: ~₦35,000 per unit

---

### 2. **Hub Sensor Station (Warehouse/Distribution Center)**

**Purpose**: Monitor storage conditions at Lagos distribution hubs

**Components**:

- **Microcontroller**: ESP32
- **Temperature Sensors**: Multiple DHT22 (4 units for different zones)
- **Humidity Sensors**: DHT22 (integrated)
- **Gas Sensors**: MQ-135 (air quality, fermentation detection)
- **Power**: Mains power with battery backup
- **Display**: 7" touchscreen for staff monitoring
- **Connectivity**: Ethernet + WiFi backup

**Cost**: ~₦85,000 per hub station

---

### 3. **Crate Beacon (Optional - Premium Tier)**

**Purpose**: Track individual QOOA crates with QR codes

**Components**:

- **BLE Beacon**: nRF52832 module
- **Temperature Sensor**: DS18B20 (small form factor)
- **Battery**: CR2032 coin cell (6-month lifespan)
- **QR Code Label**: Printed on beacon enclosure

**Cost**: ~₦2,500 per beacon

---

## Placement Strategy

### **Phase 1: Critical Monitoring Points**

#### A. **Departure Point - Northern Farms/Collection Centers**

**Location**: Kano, Jos, Kaduna aggregation centers

**Hardware**: Hub Sensor Station

**Placement**:

1. **Loading Bay**: Install temperature/gas sensors near loading area
2. **Pre-Transit Storage**: Monitor tomatoes waiting for truck loading
3. **Quality Check Station**: Record baseline temperature before transit

**Purpose**:

- Establish baseline quality metrics
- Verify tomatoes meet QOOA standards before loading
- Document initial temperature (should be < 25°C)

**Network**: WiFi available at aggregation centers

---

#### B. **In-Transit - Transport Trucks**

**Location**: Inside cargo area of refrigerated or ventilated trucks

**Hardware**: Mobile Sensor Node (1-2 per truck)

**Placement**:

```
Truck Layout (Top View):
┌─────────────────────────────────┐
│                                 │
│  🌡️ Sensor Node 1               │
│  (Front section)                │
│                                 │
│         [Crates]                │
│         [Crates]                │
│         [Crates]                │
│                                 │
│               🌡️ Sensor Node 2  │
│               (Rear section)    │
│                                 │
└─────────────────────────────────┘
```

**Mounting**:

- **Position**: Attached to truck ceiling/wall (not on floor - risk of damage)
- **Height**: 1.5m above crate level (representative air temperature)
- **Attachment**: Velcro straps or magnetic mounts (removable for multi-use)

**Data Collection**:

- **Interval**: Every 5 minutes
- **Storage**: Local SD card + real-time upload when network available
- **Critical Zones**: Lokoja, Abuja, Ibadan (network dead zones)

**Purpose**:

- Detect heat stress during 18+ hour journey
- Monitor ethanol gas levels (fermentation indicator)
- GPS tracking for route optimization
- "Lokoja Gap" feature: Cache data when offline, sync when back online

**Battery Life**: 48-72 hours (sufficient for Lagos trip with margin)

---

#### C. **Arrival Point - Lagos Distribution Hub**

**Location**: QOOA Lagos warehouse/distribution center (Mile 12 area)

**Hardware**: Hub Sensor Station + Crate Beacons (optional)

**Placement**:

1. **Receiving Area**: Immediate quality check upon truck arrival
2. **Storage Zones**:
   - Zone A: Fresh arrivals (< 6 hours)
   - Zone B: Ready for dispatch (6-24 hours)
   - Zone C: Holding area (24-48 hours)
3. **Dispatch Area**: Final check before vendor delivery

**Purpose**:

- Compare arrival vs. departure quality
- Segregate high-quality vs. degraded batches
- Optimize inventory rotation (FIFO)
- Quality-based pricing adjustments

**Network**: Ethernet + WiFi

---

#### D. **Last Mile - Vendor Stalls (Optional - Future)**

**Location**: Market vendor stalls (Mile 12, Daleko, etc.)

**Hardware**: Crate Beacon (1 per crate)

**Placement**: Attached to QOOA crate handles

**Purpose**:

- Verify delivery to correct vendor
- Monitor post-delivery storage conditions
- Vendor feedback correlation with storage quality

**Network**: BLE to vendor's smartphone app

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     QOOA IoT Data Pipeline                  │
└─────────────────────────────────────────────────────────────┘

1. SENSOR NODES (ESP32)
   └─> Read: Temperature, Humidity, Gas, GPS
   └─> Store: Local SD card (offline fallback)
   └─> Transmit: MQTT over 4G/WiFi

2. MQTT BROKER (AWS IoT Core / Mosquitto)
   └─> Topic: qooa/trucks/{truck_id}/telemetry
   └─> QoS: 1 (at least once delivery)

3. DATA PROCESSOR (AWS Lambda / Node.js)
   └─> Parse incoming telemetry
   └─> Calculate quality scores
   └─> Trigger alerts (temp > 28°C, gas > 100ppm)
   └─> Store in PostgreSQL

4. REAL-TIME UPDATES (Socket.IO / WebSocket)
   └─> Push to vendor portal dashboard
   └─> Push to admin control tower

5. DATA STORAGE
   ├─> PostgreSQL: Long-term storage
   ├─> Redis: Real-time caching
   └─> S3: Historical data archival

6. ANALYTICS (Future)
   └─> Route optimization
   └─> Quality prediction models
   └─> Seasonal trend analysis
```

---

## Installation Guide

### **Mobile Sensor Node Installation (Truck)**

**Step 1: Pre-Transit Setup**

1. Charge battery bank to 100%
2. Insert formatted SD card (32GB recommended)
3. Power on sensor node
4. Verify LED indicators:
   - Green: WiFi connected
   - Blue: GPS lock acquired
   - Yellow: SD card ready

**Step 2: Mounting**

1. Place sensor node in waterproof case
2. Mount on truck ceiling using magnetic holder or Velcro
3. Ensure sensors face downward (toward crates)
4. GPS antenna should face upward (toward sky)

**Step 3: Calibration**

1. Wait 10 minutes for sensors to stabilize
2. Record baseline readings:
   - Temperature: Should be ambient (20-28°C)
   - Humidity: 40-70%
   - Gas: < 50 ppm (no fermentation)
3. Associate sensor node with truck ID via admin app

**Step 4: Departure**

1. Confirm sensor is transmitting data
2. Check dashboard shows "Truck Active"
3. Driver receives confirmation SMS with tracking link

**Step 5: In-Transit Monitoring**

1. Data uploads every 5 minutes when network available
2. SD card logs continuously (backup)
3. Alerts sent if thresholds exceeded

**Step 6: Arrival**

1. Retrieve sensor node from truck
2. Upload any cached SD card data via WiFi
3. Generate quality report for shipment
4. Recharge battery for next trip

---

### **Hub Station Installation (Warehouse)**

**Step 1: Site Preparation**

1. Identify monitoring zones (receiving, storage, dispatch)
2. Install power outlets for each station
3. Run Ethernet cable to each zone (or WiFi extender)

**Step 2: Hardware Setup**

1. Mount sensor array on wall/ceiling
2. Connect sensors to ESP32 hub controller
3. Connect display screen for staff visibility
4. Connect to power and network

**Step 3: Configuration**

1. Access web interface (http://hub-ip-address)
2. Set zone names and alert thresholds
3. Configure staff notification contacts
4. Link to central database

**Step 4: Testing**

1. Simulate temperature spike (blow hot air on sensor)
2. Verify alert is sent to staff
3. Check data appears in admin dashboard

---

## Alert Thresholds

### **Temperature**

- **Safe**: < 25°C (Green)
- **Warning**: 25-28°C (Yellow)
- **Critical**: > 28°C (Red)
- **Action**: Above 30°C for > 1 hour → Trigger emergency cooling

### **Humidity**

- **Safe**: 40-70% (Green)
- **Warning**: 30-40% or 70-80% (Yellow)
- **Critical**: < 30% or > 80% (Red)

### **Gas Level (Ethanol)**

- **Safe**: < 80 ppm (Green)
- **Warning**: 80-100 ppm (Yellow - early fermentation)
- **Critical**: > 100 ppm (Red - active spoilage)
- **Action**: Segregate affected crates immediately

### **GPS (Location Tracking)**

- **Alert**: Truck off-route by > 50km
- **Alert**: Truck stationary for > 3 hours (potential breakdown)

---

## Quality Score Calculation

```javascript
function calculateQualityScore(telemetryData) {
  let score = 100;

  // Temperature penalty
  const avgTemp = telemetryData.avgTemperature;
  if (avgTemp > 28) score -= (avgTemp - 28) * 5;
  if (avgTemp > 32) score -= 20; // Major penalty

  // Gas level penalty
  const maxGas = telemetryData.maxGasLevel;
  if (maxGas > 80) score -= (maxGas - 80) * 0.5;
  if (maxGas > 120) score -= 30; // Major penalty

  // Transit time penalty
  const transitHours = telemetryData.transitDuration / 3600;
  if (transitHours > 24) score -= (transitHours - 24) * 2;

  // Network gap penalty (data quality)
  const dataGapHours = telemetryData.maxDataGap / 3600;
  if (dataGapHours > 4) score -= 10; // Uncertainty penalty

  return Math.max(0, Math.min(100, score));
}
```

**Quality Bands**:

- **A-Grade (90-100)**: Premium quality, full price
- **B-Grade (75-89)**: Good quality, 5% discount
- **C-Grade (60-74)**: Fair quality, 15% discount
- **D-Grade (< 60)**: Reject or heavy discount (30%)

---

## Maintenance Schedule

### **Weekly**:

- Check sensor node battery levels
- Clean sensor vents (dust/debris)
- Verify GPS antenna connection

### **Monthly**:

- Calibrate temperature sensors (ice water test)
- Update firmware if available
- Replace aging batteries

### **Quarterly**:

- Full system health check
- Replace SD cards (backup old data)
- Inspect enclosures for damage

---

## Costs & ROI

### **Initial Investment**:

- 10 Mobile Sensor Nodes: ₦350,000
- 2 Hub Stations (Kano + Lagos): ₦170,000
- 100 Crate Beacons (optional): ₦250,000
- **Total**: ₦770,000 (~$950 USD)

### **Operating Costs** (Monthly):

- Data/SMS: ₦50,000
- Battery replacements: ₦20,000
- Maintenance: ₦30,000
- **Total**: ₦100,000/month

### **Expected ROI**:

- **Waste Reduction**: 45% → 20% = 25% savings
- **Value**: ₦10M in tomatoes → ₦2.5M saved
- **Payback Period**: ~4 months
- **Annual Net Benefit**: ~₦28M

---

## Scaling Strategy

### **MVP (Months 1-3)**:

- 5 trucks monitored
- 1 Lagos hub
- Manual data review

### **Pilot (Months 4-6)**:

- 20 trucks monitored
- 2 hubs (Kano + Lagos)
- Automated alerts

### **Growth (Months 7-12)**:

- 50+ trucks
- 5 hubs (add Ibadan, Onitsha, Jos)
- Predictive analytics

### **Scale (Year 2+)**:

- 200+ trucks
- 10+ hubs nationwide
- AI-powered quality prediction
- Vendor-level monitoring (crate beacons)

---

## Technical Specifications

### **ESP32 Sensor Node Firmware**

```cpp
// Pseudo-code for ESP32 firmware
void setup() {
  initSensors();
  initSDCard();
  initGPS();
  initWiFi();
  initMQTT();
}

void loop() {
  // Read sensors every 5 minutes
  float temp = dht.readTemperature();
  float humidity = dht.readHumidity();
  int gas = analogRead(MQ3_PIN);
  GPSData gps = readGPS();

  // Create telemetry packet
  TelemetryData data = {
    temperature: temp,
    humidity: humidity,
    gasLevel: gas,
    latitude: gps.lat,
    longitude: gps.lng,
    timestamp: getEpochTime()
  };

  // Save to SD card (offline backup)
  logToSDCard(data);

  // Transmit if network available
  if (WiFi.status() == WL_CONNECTED) {
    publishMQTT("qooa/trucks/TRK001/telemetry", data);
  }

  delay(300000); // 5 minutes
}
```

---

## Network Coverage Strategy

### **Challenge**: Nigeria has network dead zones, especially:

- Lokoja - Abuja highway
- Rural areas in Kogi, Niger states

### **Solution**: Offline-First Architecture

1. **SD Card Logging**: Continuous local storage
2. **Sync on Reconnect**: Auto-upload cached data when network returns
3. **Checkpoint Uploads**: Force upload at major cities (Abuja, Ibadan)
4. **SMS Fallbacks**: Send critical alerts via SMS when data fails

### **Network Providers**:

- **Primary**: MTN (best nationwide coverage)
- **Backup**: Airtel (lower cost, good urban coverage)
- **SIM Strategy**: Dual-SIM modems with auto-failover

---

## Safety & Compliance

### **Food Safety Standards**:

- Non-toxic sensor materials
- No direct food contact
- IP65 waterproof rating
- Sterilizable enclosures

### **Data Privacy**:

- No personal vendor data on sensors
- Encrypted MQTT transmission
- Secure API endpoints
- GDPR-compliant data storage

### **Electrical Safety**:

- Low voltage (3.3V - 5V) operation
- Fused power supplies
- Waterproof connectors
- Fire-resistant enclosures

---

## Future Enhancements

### **Phase 2 (Year 2)**:

- **Computer Vision**: Camera module to detect rot visually
- **Blockchain**: Immutable quality records
- **Predictive Alerts**: ML models to predict spoilage
- **Solar Power**: Self-sustaining nodes

### **Phase 3 (Year 3)**:

- **Drone Delivery**: IoT-tracked aerial delivery for last mile
- **Cold Chain Integration**: Partner with refrigerated trucking
- **Pan-African Expansion**: Replicate in Ghana, Kenya, etc.

---

## Support & Resources

**Hardware Suppliers** (Nigeria):

- **Point One Electronics** (Lagos): ESP32, sensors
- **Compovine Technologies** (Abuja): GPS modules
- **Jumia/Konga**: Battery banks, enclosures

**Technical Support**:

- Email: hardware@qooa.com
- WhatsApp: +234-XXX-XXXX-XXX
- Documentation: https://docs.qooa.com/hardware

---

## Conclusion

The QOOA hardware strategy transforms the "invisible supply chain" into a **fully transparent, data-driven system**. By strategically placing IoT sensors at critical points—farms, trucks, and hubs—we can:

1. **Guarantee freshness** with real-time monitoring
2. **Build vendor trust** through transparent quality data
3. **Reduce waste** by 50%+ with early intervention
4. **Optimize routes** with GPS tracking
5. **Scale efficiently** with modular, low-cost hardware

**Next Steps**:

1. Procure 5 sensor nodes for pilot (₦175,000)
2. Install 1 hub station in Lagos (₦85,000)
3. Run 3-month pilot with 5 trucks
4. Analyze data and refine thresholds
5. Scale to 20 trucks by month 6

**Total Pilot Cost**: ₦260,000 (~$320 USD)
**Expected Pilot Savings**: ₦2.5M+ in waste reduction

---

_Last Updated: February 3, 2026_  
_Version: 1.0_  
_Author: QOOA Engineering Team_
