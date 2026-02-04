# 🔧 QOOA Hardware Development Brief

> **For: Hardware/Embedded Systems Developer**  
> **From: Software/Product Team**  
> **Date:** February 3, 2026  
> **Priority:** Prototype for Competition Demo

---

## ✅ **Good News: You Can Demo WITHOUT Hardware**

Your dashboard is fully functional with realistic mock data. **You don't need working hardware for the competition.** But you DO need to show judges that you understand the hardware side and have a clear plan.

---

## 🎯 **What the Hardware Team Should Build**

### **Two Devices Required:**

1. **Hub Device** (For quality triage at farm/warehouse)
2. **Truck Device** (For in-transit monitoring)

---

## 📦 **DEVICE 1: Hub Triage Device**

### **Purpose:**

Quality check tomatoes BEFORE they're loaded onto trucks. The "60-second test" that decides: Ship or Reject.

### **Components Needed:**

| Component          | Model/Type             | Purpose                       | Cost (₦)     |
| ------------------ | ---------------------- | ----------------------------- | ------------ |
| Microcontroller    | ESP32 DevKit           | WiFi connectivity, processing | 3,500        |
| Gas Sensor         | MQ-3 (Ethanol)         | Detect fermentation/ripening  | 1,200        |
| Temperature Sensor | DHT11 or DHT22         | Measure heat                  | 800          |
| LCD Display        | 16x2 I2C LCD           | Show readings to operator     | 1,500        |
| LED Indicators     | Red + Green LEDs       | Visual decision (Ship/Reject) | 200          |
| Buzzer             | Active Piezo Buzzer    | Audio alert                   | 300          |
| SD Card Module     | MicroSD breakout       | Log data offline              | 800          |
| Power Supply       | 5V/2A adapter          | Wall power                    | 1,500        |
| Enclosure          | Food-grade plastic box | Tomato-safe container         | 2,000        |
| **TOTAL**          |                        |                               | **~₦11,800** |

### **How It Works:**

1. **Operator pours tomatoes into soft-lined container and closes lid**
2. **Wait 60 seconds** (sensors stabilize, micro-climate forms)
3. **Device takes readings:**
   - Temperature
   - Ethanol gas (MQ-3 sensor)
   - Humidity
4. **Device makes decision based on thresholds:**

```
IF temp > 25°C:
    LCD shows "EXTRACT HEAT - Field heat detected"

IF gas < 100 ppm AND temp 12-20°C:
    GREEN LED lights up
    LCD shows "APPROVED - Ship to Lagos"
    Save to SD: "APPROVED, Gas: 52ppm, Temp: 18.5°C"

IF gas 100-300 ppm:
    ORANGE (LCD only - no LED)
    LCD shows "SHORT HAUL ONLY - Moderate ripening"

IF gas > 300 ppm OR temp > 28°C:
    RED LED lights up
    BUZZER sounds
    LCD shows "REJECTED - Sell locally"
    Save to SD: "REJECTED, Gas: 320ppm, Temp: 29°C"
```

### **Thresholds to Code:**

```cpp
// Hub Triage Thresholds
#define TEMP_FIELD_HEAT 25      // Show "extract heat" warning
#define TEMP_GREEN_MIN 12
#define TEMP_GREEN_MAX 20
#define TEMP_ORANGE_MIN 21
#define TEMP_ORANGE_MAX 27
#define TEMP_RED_THRESHOLD 28

#define GAS_GREEN_MAX 100       // ppm
#define GAS_ORANGE_MIN 100
#define GAS_ORANGE_MAX 300
#define GAS_RED_THRESHOLD 300   // ppm

#define HUMIDITY_GREEN_MIN 85   // %
#define HUMIDITY_GREEN_MAX 95
#define HUMIDITY_ORANGE_MIN 70
#define HUMIDITY_RED_THRESHOLD 70  // Below this = dehydration
```

### **SD Card Log Format (CSV):**

```csv
Timestamp, DeviceID, Temp, Humidity, GasPPM, Decision
2026-02-03 06:25:00, HUB_KANO_01, 18.5, 88, 52, APPROVED
2026-02-03 06:40:00, HUB_KANO_01, 29.2, 68, 320, REJECTED
2026-02-03 07:10:00, HUB_JOS_01, 19.8, 90, 85, APPROVED
```

---

## 🚛 **DEVICE 2: Truck Transit Monitor**

### **Purpose:**

Monitor cargo quality during the 18-hour journey from Kano/Jos to Lagos. Send alerts if conditions go bad.

### **Components Needed:**

| Component          | Model/Type                        | Purpose                 | Cost (₦)     |
| ------------------ | --------------------------------- | ----------------------- | ------------ |
| Microcontroller    | ESP32 DevKit                      | WiFi + processing       | 3,500        |
| Gas Sensor         | MQ-3 (Ethanol)                    | Detect fermentation     | 1,200        |
| Temperature Sensor | DHT11 or DHT22                    | Measure heat            | 800          |
| GPS Module         | Neo-6M                            | Track location          | 2,500        |
| GSM Module         | SIM800L                           | Send SMS + data (3G/4G) | 4,500        |
| SD Card Module     | MicroSD breakout                  | Offline data logging    | 800          |
| Battery Pack       | 18650 Li-ion (3x cells) + charger | 18-hour power           | 5,000        |
| Weatherproof Case  | IP65 rated enclosure              | Vibration + dust proof  | 3,500        |
| **TOTAL**          |                                   |                         | **~₦21,800** |

### **How It Works:**

1. **Device is switched on and secured in truck cargo area**
2. **Every 15 minutes:**
   - Wake up from sleep mode
   - Take GPS reading
   - Read sensors (temp, humidity, gas)
   - Check network status
3. **If network is available:**
   - Send data to cloud immediately via SIM800L
   - Save to SD card as backup
4. **If network is NOT available (Lokoja Gap):**
   - Save to SD card with timestamp + GPS
   - Set "pending sync" flag
5. **When network returns:**
   - Upload all cached SD card data in one batch
   - Clear "pending sync" flag

6. **If critical threshold exceeded:**
   - Send SMS to driver immediately: "QOOA ALERT: Temp 29°C exceeds safe range. Check ventilation. Shipment SHP-003"

### **The "Lokoja Gap" Solution:**

```cpp
void loop() {
  // Every 15 minutes
  if (millis() - lastReading > 900000) {  // 900,000ms = 15 min

    // Get readings
    float temp = dht.readTemperature();
    float humidity = dht.readHumidity();
    int gasLevel = readMQ3();
    GPSData gps = getGPSLocation();

    // Create data packet
    String dataPacket = createCSVLine(temp, humidity, gasLevel, gps);

    // Always save to SD card first (safety)
    logToSDCard(dataPacket);

    // Try to send via network
    if (checkNetworkSignal() > 0) {
      bool sent = sendToCloud(dataPacket);
      if (sent) {
        networkStatus = "online";
        // Also upload any pending SD records
        uploadPendingSDData();
      }
    } else {
      networkStatus = "offline";
      pendingRecords++;
    }

    // Check if alert needed
    if (temp > 28 || gasLevel > 400) {
      sendSMSAlert("OVERHEAT DETECTED");
    }

    lastReading = millis();
  }
}
```

### **SD Card Log Format (CSV):**

```csv
Timestamp, DeviceID, Lat, Long, Temp, Humidity, GasPPM, Status
2026-02-03 14:30:05, TRUCK_01, 12.002, 8.591, 24.5, 88, 115, OK
2026-02-03 14:45:05, TRUCK_01, 11.850, 8.420, 26.1, 85, 128, WARNING
2026-02-03 15:00:05, TRUCK_01, 11.720, 8.310, 28.4, 82, 310, DANGER
```

---

## 🧪 **MQ-3 Sensor Calibration (CRITICAL)**

The MQ-3 doesn't give PPM directly - it gives voltage (0-4095 on ESP32 ADC).

### **Calibration Process (First 60 seconds):**

```cpp
// Calibration in clean air (no tomatoes)
void calibrateMQ3() {
  int sum = 0;
  for (int i = 0; i < 100; i++) {
    sum += analogRead(MQ3_PIN);
    delay(100);  // 100ms between readings
  }
  cleanAirValue = sum / 100;  // Average baseline
  Serial.println("Clean air baseline: " + String(cleanAirValue));
}

// Convert ADC value to estimated PPM
int readMQ3PPM() {
  int rawValue = analogRead(MQ3_PIN);

  // Simple conversion (you'll calibrate this with known ethanol concentrations)
  // This is an approximation - calibrate with known PPM sources
  float ratio = (float)rawValue / cleanAirValue;

  // Rough conversion (based on MQ-3 datasheet curve)
  int ppm = (int)(pow(10, ((log10(ratio) - 0.4) / -0.35)));

  return ppm;
}
```

**Note:** Tell hardware person to calibrate with known ethanol sources (rubbing alcohol at known concentrations) for accuracy.

---

## 🔋 **Power Management (Truck Device)**

**Battery Life Calculation:**

- ESP32 sleep mode: 10mA
- ESP32 active: 160mA
- GPS active: 60mA
- SIM800L active: 2000mA (peak during transmission)

**Cycle:**

- Sleep 14.5 minutes: ~10mA
- Wake 30 seconds: 160mA + 60mA (GPS) = 220mA
- Transmit 10 seconds: 2000mA
- Average per 15-min cycle: ~30mAh

**18-hour journey = 72 cycles**
**Total capacity needed: 72 × 30mAh = 2,160mAh**

**Solution:** 3× 18650 batteries (2500mAh each) = 7,500mAh capacity
**Result:** 3.5× safety margin, can handle 60+ hours

---

## 📡 **Network Strategy (SIM800L Setup)**

### **SIM Card Requirements:**

- Data plan: 50MB/month is enough
- SMS capability (for alerts)
- Roaming enabled (if crossing state borders)

**Recommended Providers in Nigeria:**

1. MTN (best coverage on highways)
2. Airtel (cheaper data)
3. Glo (avoid - poor rural coverage)

### **Data Usage Estimate:**

- Each reading: ~150 bytes JSON
- 96 readings per day (every 15 min)
- Daily data: 14KB
- Monthly: 420KB (~0.4MB)

**Add 20MB for overhead/retries = 20MB/month sufficient**

---

## 🔐 **Security (Device Authentication)**

Each device needs unique ID and token:

```cpp
// Store in device EEPROM or hardcode
const char* DEVICE_ID = "TRK-101";
const char* API_TOKEN = "qooa_device_a8d9f7s6d5f4g3h2j1k0";

// When sending data
String payload = "{"
  "\"device_id\":\"" + String(DEVICE_ID) + "\","
  "\"token\":\"" + String(API_TOKEN) + "\","
  "\"shipment_id\":\"SHP-001\","
  "\"data\": {...}"
"}";
```

---

## 🛠️ **Physical Protection (The "Nigerian Road" Factor)**

### **Vibration Protection:**

1. **SD Card:** Use electrical tape over slot (prevents ejection)
2. **Wiring:** Hot glue all connections
3. **Case:** Mount in foam padding inside weatherproof box
4. **Battery:** Velcro straps to secure pack

### **Hub Device - Food Safety:**

1. **Inner lining:** Food-grade silicone or polyethylene foam (white soft foam)
2. **Avoid:** Open-cell sponges (absorb tomato juice, cause mold)
3. **Cleaning:** Wipe with 70% ethanol after each batch

---

## 📋 **What Hardware Person Should Deliver**

### **Phase 1: Prototype for Demo (2-3 weeks)** 🔴 URGENT

**Goal:** Show judges a working device (even without full features)

**Minimum Viable Prototype:**

1. ESP32 + DHT11 + MQ-3 connected
2. Can read sensors and display on Serial Monitor
3. Can save to SD card
4. RED/GREEN LEDs work based on thresholds
5. LCD shows readings (for Hub device)

**You don't need:**

- GPS working (can show on map mockup)
- SIM800L connected (can demo SMS separately)
- Cloud connectivity (frontend has mock data)

### **Phase 2: Pilot-Ready Device (4-6 weeks)** 🟡 POST-DEMO

**After competition, add:**

1. GPS tracking
2. SIM800L data transmission
3. SMS alerts
4. Full battery testing (18-hour endurance)
5. Weatherproof enclosure
6. API integration with backend

---

## 🎬 **How to Demo Hardware at Competition**

### **Option 1: Live Demo (If prototype ready)**

1. Bring Hub device
2. Put tomatoes in container
3. Show readings on LCD
4. Green LED lights up
5. "This data is saved to SD card and eventually syncs to dashboard"

### **Option 2: Video Demo (Safer)**

1. Record 2-minute video of device working
2. Show sensor readings changing
3. Show LEDs lighting based on thresholds
4. "This is our functional prototype - we're now building 5 units for pilot"

### **Option 3: Photos + Explanation (Minimum)**

1. Show assembled device (even on breadboard is fine)
2. Explain component selection
3. Show SD card log file
4. "Hardware is functional - now scaling for production"

---

## 💰 **Cost Summary**

| Item                | Quantity | Unit Cost | Total        |
| ------------------- | -------- | --------- | ------------ |
| Hub Device          | 2 units  | ₦12,000   | ₦24,000      |
| Truck Device        | 5 units  | ₦22,000   | ₦110,000     |
| Development/Testing | -        | -         | ₦50,000      |
| **TOTAL HARDWARE**  |          |           | **₦184,000** |

**For competition demo:** Just build 1 Hub device = ₦12,000

---

## 📞 **Questions for Hardware Developer**

**Send them this and ask:**

1. **Can you build the Hub device (simpler one) first?**
2. **Do you have ESP32 and sensors already?**
3. **Can you deliver a working prototype in 2-3 weeks?**
4. **Have you worked with MQ-3 gas sensors before?**
5. **Timeline for 5 truck devices after demo?**

---

## 🎯 **Critical Points to Emphasize**

### **To Hardware Person:**

> "We DON'T need perfect hardware for the competition demo. The software dashboard is fully functional with mock data. What we need is:
>
> 1. **Proof of concept:** A working Hub device that shows we understand the hardware
> 2. **Data format:** You log data to SD card in the exact CSV format we specified
> 3. **Future integration:** After demo, you'll connect to our backend API (we'll provide endpoints)
>
> For now, focus on:
>
> - Get sensors working
> - Implement threshold logic (RED/GREEN LEDs)
> - Save to SD card
> - Don't worry about WiFi/cloud yet
>
> The judges need to see you have a PLAN and a working prototype, not a perfect production device."

---

## 📧 **Simple Message to Send Hardware Developer**

---

**Subject:** Hardware Requirements for QOOA (ESP32 IoT Devices)

Hey [Name],

I'm building the dashboard for QOOA (tomato logistics tracking). I need you to build the IoT devices - **2 types:**

1. **Hub Device** - For quality testing at farms (60-second test)
2. **Truck Device** - For monitoring during 18-hour transit

**Full specifications:** See attached `HARDWARE_REQUIREMENTS.md`

**For the competition demo (2-3 weeks), I only need:**

- 1× Hub device prototype (ESP32 + MQ-3 + DHT11 + LEDs + LCD)
- Readings save to SD card in CSV format
- RED/GREEN LED decision logic working

We don't need GPS, SIM800L, or cloud connectivity yet. Just prove the sensors work and threshold logic is correct.

**Budget:** ₦12,000 for prototype  
**Timeline:** 2-3 weeks

**Questions:**

1. Can you build this?
2. Do you have the components or need to order?
3. Have you used MQ-3 sensors before?
4. What's your timeline estimate?

Let me know!

---

## ✅ **Yes, You Can Demo Without Hardware**

**Your current dashboard is 100% ready for competition.** The hardware is:

- ✅ Nice to have (shows you're serious)
- ✅ Good for photos/video
- ✅ Proves feasibility

But **NOT required** to win. Many winning pitches show prototypes, not perfect products.

**Focus:** If hardware person can deliver in 2 weeks, great. If not, show circuit diagrams and explain the plan. Judges will understand.

Your SOFTWARE is your strength - demo that confidently! 🚀🍅
