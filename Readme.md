# QOOA: The Invisible Supply Chain for Perishable Goods 🍅🚀

> **Empowering Farmers. Stabilizing Prices. Eliminating Waste.**

## 📋 Executive Summary

**QOOA** is a digital logistics platform designed to solve the **45-50% post-harvest loss** of tomatoes in Nigeria.

This repository contains the **High-Fidelity MVP (Minimum Viable Product)** for the B2B Control Tower. It demonstrates the core loop of ordering, tracking, and verifying the quality of goods traveling from Northern hubs (Kano/Jos) to Southern markets (Lagos).

---

## 🛑 The Problem

- **Massive Waste:** 45-50% of tomatoes spoil due to heat and compression in raffia baskets.
- **The "Blind Spot":** B2B buyers have zero visibility on cargo health during the 18+ hour journey.
- **Economic Loss:** ₦72 Billion lost annually.

## 💡 The Solution: "Science + Infrastructure + Tech"

We combine **Bio-Shield organic coating** and **HDPE Crates** with a **Digital Control Tower** to guarantee freshness.

---

## ⚡ Core Functionality (Working Demo)

This prototype demonstrates the following live features:

### 1. 🔐 B2B Vendor Portal

- **Simulated Login:** Secure entry point for verified bulk buyers (e.g., Mile 12 Market Vendors).
- **Session Management:** Uses local storage to maintain user state.

### 2. 🚛 Real-Time Logistics Dashboard

- **Active Shipment Tracking:** Visualizes shipments moving from Kano -> Lagos.
- **Status Logic:** Automatically flags shipments as **Green** (Safe), **Orange** (Warning), or **Red** (Critical) based on sensor data.

### 3. ➕ Instant Order Placement

- **One-Click Restocking:** Vendors can place new B2B orders instantly.
- **Dynamic Updates:** New orders immediately appear on the tracking board with assigned truck IDs and "In-Transit" status.

### 4. 📡 IoT Digital Twin ("The Hardware Link")

Clicking any shipment reveals the **Live Telemetry Modal**, which simulates data from our ESP32 Hardware nodes:

- **Gas Monitoring (MQ-3):** Tracks Ethanol levels to detect fermentation (Threshold: >100ppm = Warning).
- **Temperature (DHT11):** Monitors heat stress (Threshold: >28°C = Critical).
- [cite_start]**The "Lokoja Gap" Feature:** Demonstrates our offline-first architecture by simulating data caching when trucks enter network dead zones[cite: 38].

### 5. 📜 Digital Freshness Certification

- **Automated Reporting:** Generates a "Proof of Quality" certificate for green-status shipments.
- **Data Fusion:** Combines Hub Entry Data with Transit Logs to validate the cold chain integrity.

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, Tailwind CSS (CDN).
- **Logic:** Vanilla JavaScript (ES6+).
- **Data:** Client-side mock database (`data.js`) simulating IoT sensor streams.
- [cite_start]**Architecture:** Component-based design with `utils.js` handling the scientific threshold logic[cite: 36].

---

## 🚀 How to Run the Demo

1.  **Clone the Repository.**
2.  **Launch via Live Server:**
    - Open `index.html` (The Login Page) using VS Code Live Server or drag it into Chrome.
    - _Note: Must start at `index.html` to initialize the user session._
3.  **Demo Walkthrough:**
    - **Login:** Click "Access Control Tower" (Credentials are pre-filled).
    - **View:** Observe the Dashboard stats.
    - **Action:** Click **"New Order"** to dispatch a fresh truck from Kano.
    - **Inspect:** Click the new shipment to see the **Live Sensor Data**.
    - **Verify:** Click **"Generate Freshness Report"** to see the final certificate.

---

## 📊 Scientific Logic (The "Why")

[cite_start]The dashboard logic is hardcoded to strict agricultural standards[cite: 36]:
| Metric | Safe (Green) | Warning (Orange) | Danger (Red) |
| :--- | :--- | :--- | :--- |
| **Temperature** | 12°C - 20°C | 21°C - 27°C | > 28°C |
| **Gas (MQ-3)** | < 100 ppm | 100 - 300 ppm | > 300 ppm |

_> "We don't just move tomatoes; we move data that proves freshness."_
