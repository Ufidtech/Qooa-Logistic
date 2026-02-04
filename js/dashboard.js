// QOOA Control Tower - Dashboard Logic

// ========== AUTHENTICATION CHECK ==========
function checkAuthentication() {
  const session = localStorage.getItem("qooa_session");
  if (!session) {
    window.location.href = "index.html";
  }
}

// ========== DASHBOARD INITIALIZATION ==========
document.addEventListener("DOMContentLoaded", function () {
  checkAuthentication();
  renderDashboard();
  setupEventListeners();
});

// ========== SETUP EVENT LISTENERS ==========
function setupEventListeners() {
  // New Order Button
  const newOrderBtn = document.getElementById("newOrderBtn");
  if (newOrderBtn) {
    newOrderBtn.addEventListener("click", openOrderModal);
  }

  // Sidebar Navigation
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();

      // Remove active class from all items
      navItems.forEach((nav) => nav.classList.remove("active"));

      // Add active class to clicked item
      this.classList.add("active");

      // Get the navigation text
      const navText = this.textContent.trim();

      // Switch view based on section
      switchView(navText);
    });
  });

  // Modal Close Buttons
  const closeButtons = document.querySelectorAll(".modal-close");
  closeButtons.forEach((btn) => {
    btn.addEventListener("click", closeAllModals);
  });

  // Click outside modal to close
  window.addEventListener("click", function (e) {
    if (e.target.classList.contains("modal")) {
      closeAllModals();
    }
  });

  // Order Form Submit
  const orderForm = document.getElementById("orderForm");
  if (orderForm) {
    orderForm.addEventListener("submit", handleNewOrder);
  }

  // Logout Button
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }
}

// ========== RENDER DASHBOARD ==========
function renderDashboard() {
  updateStats();
  renderShipments();
}

// ========== UPDATE STATISTICS ==========
function updateStats() {
  const stats = getStats();

  document.getElementById("totalShipments").textContent = stats.totalShipments;
  document.getElementById("inTransit").textContent = stats.inTransit;
  document.getElementById("bioShieldActive").textContent =
    stats.bioShieldActive;
  document.getElementById("completed").textContent = stats.completed;
}

// ========== RENDER SHIPMENTS (Main Function) ==========
function renderShipments() {
  const container = document.getElementById("shipmentsContainer");

  if (!container) {
    console.error("Shipments container not found!");
    return;
  }

  // Clear existing content
  container.innerHTML = "";

  // Check if there are shipments
  if (shipments.length === 0) {
    container.innerHTML = '<p class="loading">No shipments available</p>';
    return;
  }

  // Loop through shipments and create HTML cards
  shipments.forEach((shipment) => {
    const latestTelemetry = getLatestTelemetry(shipment.id);
    const card = createShipmentCard(shipment, latestTelemetry);
    container.appendChild(card);
  });
}

// ========== CREATE SHIPMENT CARD HTML ==========
function createShipmentCard(shipment, telemetry) {
  const card = document.createElement("div");
  card.className = "shipment-card";

  // Determine quality status badge color
  const qualityBadgeClass =
    shipment.qualityStatus === "Green"
      ? "badge-green"
      : shipment.qualityStatus === "Orange"
        ? "badge-orange"
        : "badge-red";

  // Hub Triage Decision Badge
  const triageDisplay = getHubTriageDisplay(shipment.hubTriageDecision);
  const triageBadge = `<span class="badge ${triageDisplay.class}">${triageDisplay.icon} ${triageDisplay.label}</span>`;

  // Field Heat Detection Badge
  const fieldHeatBadge = shipment.fieldHeatDetected
    ? '<span class="badge" style="background: #fef3c7; color: #92400e;">🌡️ Field Heat Extracted</span>'
    : "";

  // Network Status Badge (CRITICAL: Lokoja Gap Feature)
  let networkBadge = "";
  let sdSyncBadge = "";
  if (shipment.networkStatus === "offline") {
    networkBadge = '<span class="badge badge-offline">📡 Cached to SD</span>';
    if (shipment.sdSyncStatus && shipment.sdSyncStatus.pendingRecords > 0) {
      sdSyncBadge = `<span class="badge" style="background: #fef3c7; color: #92400e;">⏳ ${shipment.sdSyncStatus.pendingRecords} records pending sync</span>`;
    }
  } else {
    networkBadge = '<span class="badge badge-online">🌐 Online</span>';
    if (shipment.sdSyncStatus && shipment.sdSyncStatus.lastSyncTime) {
      const syncTime = formatTime(shipment.sdSyncStatus.lastSyncTime);
      sdSyncBadge = `<span class="badge" style="background: #d1fae5; color: #065f46;">✅ Synced at ${syncTime}</span>`;
    }
  }

  // Bio-Shield Badge
  const bioShieldBadge = shipment.bioShieldApplied
    ? '<span class="badge badge-green">🛡️ Bio-Shield</span>'
    : '<span class="badge" style="background: #fee2e2; color: #991b1b;">⚠️ No Bio-Shield</span>';

  // Alerts Badge
  let alertsBadge = "";
  if (shipment.alerts && shipment.alerts.length > 0) {
    const criticalAlerts = shipment.alerts.filter(
      (a) => a.severity === "red",
    ).length;
    const warningAlerts = shipment.alerts.filter(
      (a) => a.severity === "orange",
    ).length;
    if (criticalAlerts > 0) {
      alertsBadge = `<span class="badge badge-red">🚨 ${criticalAlerts} Critical Alert${criticalAlerts > 1 ? "s" : ""}</span>`;
    } else if (warningAlerts > 0) {
      alertsBadge = `<span class="badge badge-orange">⚠️ ${warningAlerts} Warning${warningAlerts > 1 ? "s" : ""}</span>`;
    }
  }

  card.innerHTML = `
        <div class="shipment-header">
            <div>
                <div class="shipment-id">${shipment.id}</div>
                <div class="shipment-route">
                    📍 ${shipment.origin} → ${shipment.destination}
                </div>
            </div>
            <span class="badge ${qualityBadgeClass}">${shipment.qualityStatus}</span>
        </div>

        <div class="shipment-details">
            <div class="detail-item">
                <span class="detail-label">Truck ID</span>
                <div class="detail-value">${shipment.truckId}</div>
            </div>
            <div class="detail-item">
                <span class="detail-label">Driver</span>
                <div class="detail-value">${shipment.driverName}</div>
            </div>
            <div class="detail-item">
                <span class="detail-label">Crates</span>
                <div class="detail-value">${shipment.crateCount} (${shipment.crateIds ? shipment.crateIds.length : 0} IDs)</div>
            </div>
            <div class="detail-item">
                <span class="detail-label">Current Location</span>
                <div class="detail-value">${shipment.currentLocation}</div>
            </div>
        </div>

        <!-- Hub Triage Section -->
        <div style="margin-top: 12px; padding: 8px; background: #f9fafb; border-radius: 6px;">
            <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">Hub Triage Result:</div>
            ${triageBadge}
            ${fieldHeatBadge}
        </div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px;">
            ${networkBadge}
            ${sdSyncBadge}
            ${bioShieldBadge}
            ${alertsBadge}
            <span class="badge badge-in-transit">${shipment.status}</span>
        </div>

        <div class="shipment-actions">
            <button class="btn-small" onclick="openTruckModal('${shipment.id}')">
                View Telemetry
            </button>
            ${
              alertsBadge
                ? `<button class="btn-small" style="background: #f59e0b;" onclick="viewAlerts('${shipment.id}')">
                📋 View Alerts
              </button>`
                : ""
            }
            ${
              shipment.qualityStatus === "Green" &&
              shipment.networkStatus === "online"
                ? `<button class="btn-small" style="background: #10b981;" onclick="generateFreshnessReport('${shipment.id}')">
                    📋 Freshness Report
                  </button>`
                : `<button class="btn-small" style="background: #d1d5db; color: #6b7280; cursor: not-allowed;" disabled>
                    📋 Report Unavailable
                  </button>`
            }
        </div>
    `;

  return card;
}

// ========== MODAL LOGIC: OPEN TRUCK TELEMETRY MODAL ==========
function openTruckModal(shipmentId) {
  const shipment = getShipmentById(shipmentId);
  const latestTelemetry = getLatestTelemetry(shipmentId);
  const telemetryHistory = getShipmentTelemetryHistory(shipmentId);

  if (!shipment) {
    alert("Shipment not found!");
    return;
  }

  const modal = document.getElementById("truckModal");

  // Populate modal header
  document.getElementById("modalShipmentId").textContent = shipment.id;
  document.getElementById("modalTruckId").textContent = shipment.truckId;

  // Populate Current Readings (Latest Telemetry)
  if (latestTelemetry) {
    populateCurrentReadings(latestTelemetry, shipment);
  } else {
    document.getElementById("currentReadings").innerHTML =
      "<p>No telemetry data available</p>";
  }

  // Populate Timeline (Full History)
  populateTelemetryTimeline(telemetryHistory);

  // Show modal
  modal.style.display = "flex";
}

// ========== POPULATE CURRENT SENSOR READINGS ==========
function populateCurrentReadings(telemetry, shipment) {
  const container = document.getElementById("currentReadings");

  // Calculate status for each sensor
  const tempStatus = getTempStatus(telemetry.temperature);
  const gasStatus = getGasStatus(telemetry.gasLevel);
  const humidityStatus = getHumidityStatus(telemetry.humidity);

  // Network Status
  const networkDisplay =
    shipment.networkStatus === "offline"
      ? '📡 <span style="color: #f59e0b;">Cached to SD (Offline)</span>'
      : '🌐 <span style="color: #10b981;">Online</span>';

  container.innerHTML = `
        <div class="sensor-card">
            <div class="sensor-icon">🌡️</div>
            <div class="sensor-data">
                <h4>Temperature</h4>
                <div class="sensor-value ${tempStatus.class}">${telemetry.temperature}°C</div>
                <div class="sensor-unit">${tempStatus.label}</div>
            </div>
        </div>

        <div class="sensor-card">
            <div class="sensor-icon">💨</div>
            <div class="sensor-data">
                <h4>Ethylene Gas</h4>
                <div class="sensor-value ${gasStatus.class}">${telemetry.gasLevel} ppm</div>
                <div class="sensor-unit">${gasStatus.label}</div>
            </div>
        </div>

        <div class="sensor-card">
            <div class="sensor-icon">💧</div>
            <div class="sensor-data">
                <h4>Humidity</h4>
                <div class="sensor-value ${humidityStatus.class}">${telemetry.humidity}%</div>
                <div class="sensor-unit">${humidityStatus.label}</div>
            </div>
        </div>

        <div class="sensor-card">
            <div class="sensor-icon">📡</div>
            <div class="sensor-data">
                <h4>Network Status</h4>
                <div class="sensor-value">${networkDisplay}</div>
                <div class="sensor-unit">${telemetry.location.name}</div>
            </div>
        </div>

        <!-- Hub Entry Data Section -->
        <div class="sensor-card" style="grid-column: 1 / -1; background: #f9fafb;">
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <div>
                    <h4 style="color: #374151; margin-bottom: 8px;">🏭 Hub Triage Results</h4>
                    <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                        <div>
                            <span style="font-size: 12px; color: #6b7280;">Initial Temp:</span>
                            <strong style="margin-left: 4px; color: #111827;">${shipment.hubTemperature}°C</strong>
                        </div>
                        <div>
                            <span style="font-size: 12px; color: #6b7280;">Initial Gas:</span>
                            <strong style="margin-left: 4px; color: #111827;">${shipment.hubGasReading} ppm</strong>
                        </div>
                        <div>
                            <span style="font-size: 12px; color: #6b7280;">Initial Humidity:</span>
                            <strong style="margin-left: 4px; color: #111827;">${shipment.hubHumidity}%</strong>
                        </div>
                    </div>
                </div>
                <div style="text-align: right;">
                    ${getHubTriageDisplay(shipment.hubTriageDecision).icon}
                    <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">${formatTime(shipment.hubTriageTimestamp)}</div>
                </div>
            </div>
        </div>
    `;
}

// ========== POPULATE TELEMETRY TIMELINE ==========
function populateTelemetryTimeline(history) {
  const container = document.getElementById("telemetryTimeline");

  if (!history || history.length === 0) {
    container.innerHTML = "<p>No historical data available</p>";
    return;
  }

  container.innerHTML = '<div class="timeline">';

  // Reverse to show most recent first
  const reversedHistory = [...history].reverse();

  reversedHistory.forEach((reading) => {
    const tempStatus = getTempStatus(reading.temperature);
    const gasStatus = getGasStatus(reading.gasLevel);
    const overallStatus = getOverallStatus(
      reading.temperature,
      reading.gasLevel,
    );

    const timeFormatted = new Date(reading.timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    container.innerHTML += `
            <div class="timeline-item">
                <div class="timeline-marker ${overallStatus}"></div>
                <div class="timeline-content">
                    <h4>${reading.location.name}</h4>
                    <div class="timeline-time">${timeFormatted}</div>
                    <div class="timeline-readings">
                        <span class="${tempStatus.class}">🌡️ ${reading.temperature}°C</span>
                        <span class="${gasStatus.class}">💨 ${reading.gasLevel} ppm</span>
                        <span>💧 ${reading.humidity}%</span>
                        <span>${reading.networkStatus === "online" ? "🌐 Online" : "📡 Offline"}</span>
                    </div>
                </div>
            </div>
        `;
  });

  container.innerHTML += "</div>";
}

// ========== UTILITY: GET TEMPERATURE STATUS ==========
function getTempStatus(temp) {
  if (temp >= 12 && temp <= 20) {
    return { class: "status-green", label: "Optimal Range" };
  } else if (temp >= 21 && temp <= 27) {
    return { class: "status-orange", label: "Warning Range" };
  } else if (temp > 28) {
    return { class: "status-red", label: "DANGER - Critical" };
  } else {
    return { class: "status-orange", label: "Below Optimal" };
  }
}

// ========== UTILITY: GET GAS STATUS ==========
function getGasStatus(gasLevel) {
  if (gasLevel < 100) {
    return { class: "status-green", label: "Safe Level" };
  } else if (gasLevel >= 100 && gasLevel <= 300) {
    return { class: "status-orange", label: "Elevated - Monitor" };
  } else {
    return { class: "status-red", label: "CRITICAL - Spoilage Risk" };
  }
}

// ========== UTILITY: GET OVERALL STATUS ==========
function getOverallStatus(temp, gasLevel) {
  const tempIsDanger = temp > 28;
  const gasIsDanger = gasLevel > 300;
  const tempIsWarning = temp >= 21 && temp <= 27;
  const gasIsWarning = gasLevel >= 100 && gasLevel <= 300;

  if (tempIsDanger || gasIsDanger) {
    return "red";
  } else if (tempIsWarning || gasIsWarning) {
    return "orange";
  } else {
    return "green";
  }
}

// ========== UTILITY: GET OVERALL STATUS ==========
function getOverallStatus(temp, gasLevel) {
  const tempIsDanger = temp > 28;
  const gasIsDanger = gasLevel > 300;
  const tempIsWarning = temp >= 21 && temp <= 27;
  const gasIsWarning = gasLevel >= 100 && gasLevel <= 300;

  if (tempIsDanger || gasIsDanger) {
    return "red";
  } else if (tempIsWarning || gasIsWarning) {
    return "orange";
  } else {
    return "green";
  }
}

// ========== UTILITY: GET STATUS COLOR ==========
function getStatusColor(status) {
  switch (status.toLowerCase()) {
    case "green":
      return "#10b981";
    case "orange":
      return "#f59e0b";
    case "red":
      return "#ef4444";
    default:
      return "#6b7280";
  }
}

// ========== UTILITY: GET STATUS BADGE CLASS ==========
function getStatusBadgeClass(status) {
  switch (status.toLowerCase()) {
    case "green":
      return "badge-green";
    case "orange":
      return "badge-orange";
    case "red":
      return "badge-red";
    default:
      return "badge";
  }
}

// ========== UTILITY: GET RELATIVE TIME ==========
function getRelativeTime(isoDate) {
  if (!isoDate) return "N/A";

  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

// ========== FRESHNESS REPORT (Digital Certificate) ==========
function generateFreshnessReport(shipmentId) {
  const shipment = getShipmentById(shipmentId);
  const telemetryHistory = getShipmentTelemetryHistory(shipmentId);

  if (!shipment) {
    alert("Shipment not found!");
    return;
  }

  // Calculate average readings from transit logs
  let avgTemp = 0,
    avgGas = 0,
    avgHumidity = 0;
  if (telemetryHistory.length > 0) {
    telemetryHistory.forEach((reading) => {
      avgTemp += reading.temperature;
      avgGas += reading.gasLevel;
      avgHumidity += reading.humidity;
    });
    avgTemp = (avgTemp / telemetryHistory.length).toFixed(1);
    avgGas = (avgGas / telemetryHistory.length).toFixed(1);
    avgHumidity = (avgHumidity / telemetryHistory.length).toFixed(1);
  }

  // Generate Digital Certificate Summary
  const report = `
╔════════════════════════════════════════════╗
        QOOA DIGITAL FRESHNESS CERTIFICATE
╚════════════════════════════════════════════╝

📦 SHIPMENT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Shipment ID: ${shipment.id}
Truck ID: ${shipment.truckId}
Driver: ${shipment.driverName}
Origin: ${shipment.origin}
Destination: ${shipment.destination}
Crates: ${shipment.crateCount}

🧪 HUB BASELINE (Pre-Transit)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Temperature: ${shipment.hubTemperature}°C
Ethylene Gas: ${shipment.hubGasReading} ppm
Bio-Shield Applied: ${shipment.bioShieldApplied ? "YES ✅" : "NO ❌"}

📊 TRANSIT PERFORMANCE (Average)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Avg. Temperature: ${avgTemp}°C
Avg. Ethylene Gas: ${avgGas} ppm
Avg. Humidity: ${avgHumidity}%
Data Points Logged: ${telemetryHistory.length}

✅ QUALITY STATUS: ${shipment.qualityStatus.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This shipment meets QOOA quality standards.
Safe for market distribution.

🔐 Certificate Hash: QOOA-${shipment.id}-${Date.now()}
Generated: ${new Date().toLocaleString()}
    `;

  alert(report);
  console.log(report); // Also log for B2B vendor records
}

// ========== OPEN NEW ORDER MODAL ==========
function openOrderModal() {
  const modal = document.getElementById("orderModal");
  modal.style.display = "flex";
}

// ========== CLOSE ALL MODALS ==========
function closeAllModals() {
  document.getElementById("truckModal").style.display = "none";
  document.getElementById("orderModal").style.display = "none";
}

// ========== HANDLE NEW ORDER SUBMISSION ==========
function handleNewOrder(e) {
  e.preventDefault();

  const formData = {
    origin: document.getElementById("orderOrigin").value,
    destination: document.getElementById("orderDestination").value,
    crates: parseInt(document.getElementById("orderCrates").value),
    bioShield: document.getElementById("orderBioShield").checked,
  };

  // Validate form
  if (!formData.origin || !formData.destination || !formData.crates) {
    alert("Please fill in all required fields!");
    return;
  }

  if (formData.crates < 1 || formData.crates > 1000) {
    alert("Crates must be between 1 and 1000");
    return;
  }

  // Create new order
  const newShipment = createNewOrder(formData);

  // Success message
  alert(
    `✅ Order Created Successfully!\n\nShipment ID: ${newShipment.id}\nTruck ID: ${newShipment.truckId}\n\nDriver will be assigned shortly.`,
  );

  // Reset form and close modal
  document.getElementById("orderForm").reset();
  closeAllModals();

  // Re-render dashboard
  renderDashboard();
}

// ========== LOGOUT ==========
function handleLogout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("qooa_session");
    window.location.href = "index.html";
  }
}

// ========== VIEW SWITCHING ==========
function switchView(viewName) {
  // Update header title
  const headerTitle = document.querySelector(".header-left h1");
  const headerSubtitle = document.querySelector(".header-left p");

  switch (viewName) {
    case "Dashboard":
      headerTitle.textContent = "Logistics Control Tower";
      headerSubtitle.textContent = "Real-time monitoring • 3 active shipments";
      document.querySelector(".stats-section").style.display = "block";
      document.querySelector(".shipments-section h2").textContent =
        "Active Shipments";
      renderShipments();
      break;

    case "Shipments":
      headerTitle.textContent = "All Shipments";
      headerSubtitle.textContent = "Complete shipment tracking and management";
      document.querySelector(".stats-section").style.display = "none";
      document.querySelector(".shipments-section h2").textContent =
        "Shipment List";
      renderShipments();
      showNotification("📦 Viewing all shipments");
      break;

    case "Live Telemetry":
      headerTitle.textContent = "Live Telemetry Stream";
      headerSubtitle.textContent =
        "Real-time sensor monitoring across all trucks";
      document.querySelector(".stats-section").style.display = "none";
      renderTelemetryView();
      showNotification("📡 Live sensor data streaming");
      break;

    case "Reports":
      headerTitle.textContent = "Analytics & Reports";
      headerSubtitle.textContent = "Quality insights and performance metrics";
      document.querySelector(".stats-section").style.display = "block";
      renderReportsView();
      showNotification("📊 Generating analytics report");
      break;

    case "Settings":
      headerTitle.textContent = "System Settings";
      headerSubtitle.textContent = "Configure alerts and thresholds";
      document.querySelector(".stats-section").style.display = "none";
      renderSettingsView();
      showNotification("⚙️ System configuration");
      break;
  }
}

// ========== TELEMETRY VIEW ==========
function renderTelemetryView() {
  const container = document.getElementById("shipmentsContainer");
  container.innerHTML = "";

  shipments.forEach((shipment) => {
    const telemetry = getLatestTelemetry(shipment.id);
    if (!telemetry) return;

    const card = document.createElement("div");
    card.className = "shipment-card";
    card.style.borderLeft = `4px solid ${getStatusColor(shipment.qualityStatus)}`;

    const tempStatus = getTempStatus(telemetry.temperature);
    const gasStatus = getGasStatus(telemetry.gasLevel);

    card.innerHTML = `
            <div class="shipment-header">
                <div>
                    <div class="shipment-id">${shipment.id} - ${shipment.truckId}</div>
                    <div class="shipment-route">📍 ${telemetry.location.name}</div>
                </div>
                <span class="badge ${getStatusBadgeClass(shipment.qualityStatus)}">${shipment.qualityStatus}</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px;">
                <div class="sensor-card" style="padding: 16px;">
                    <div class="sensor-icon" style="font-size: 2em;">🌡️</div>
                    <div>
                        <h4 style="font-size: 0.85em; color: #6b7280; margin-bottom: 4px;">Temperature</h4>
                        <div class="sensor-value ${tempStatus.class}" style="font-size: 1.5em;">${telemetry.temperature}°C</div>
                    </div>
                </div>
                <div class="sensor-card" style="padding: 16px;">
                    <div class="sensor-icon" style="font-size: 2em;">💨</div>
                    <div>
                        <h4 style="font-size: 0.85em; color: #6b7280; margin-bottom: 4px;">Gas Level</h4>
                        <div class="sensor-value ${gasStatus.class}" style="font-size: 1.5em;">${telemetry.gasLevel} ppm</div>
                    </div>
                </div>
            </div>
            <div style="margin-top: 12px; display: flex; gap: 8px; align-items: center;">
                <span>💧 ${telemetry.humidity}%</span>
                <span>${shipment.networkStatus === "offline" ? "📡 Cached to SD" : "🌐 Online"}</span>
                <span style="margin-left: auto; color: #6b7280; font-size: 0.85em;">${getRelativeTime(telemetry.timestamp)}</span>
            </div>
        `;
    container.appendChild(card);
  });
}

// ========== REPORTS VIEW ==========
function renderReportsView() {
  const container = document.getElementById("shipmentsContainer");
  const stats = getStats();

  const greenShipments = shipments.filter((s) => s.qualityStatus === "Green");
  const orangeShipments = shipments.filter((s) => s.qualityStatus === "Orange");
  const redShipments = shipments.filter((s) => s.qualityStatus === "Red");

  container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
            <div class="shipment-card" style="border-left: 4px solid #10b981;">
                <h3 style="color: #10b981; margin-bottom: 16px;">✅ Quality Performance</h3>
                <div style="font-size: 3em; font-weight: bold; color: #10b981; margin: 16px 0;">
                    ${((greenShipments.length / shipments.length) * 100).toFixed(0)}%
                </div>
                <p style="color: #6b7280;">Shipments in Safe Range</p>
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                        <span>🟢 Green:</span><strong>${greenShipments.length}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                        <span>🟠 Orange:</span><strong>${orangeShipments.length}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                        <span>🔴 Red:</span><strong>${redShipments.length}</strong>
                    </div>
                </div>
            </div>
            
            <div class="shipment-card" style="border-left: 4px solid #3b82f6;">
                <h3 style="color: #3b82f6; margin-bottom: 16px;">🛡️ Bio-Shield Coverage</h3>
                <div style="font-size: 3em; font-weight: bold; color: #3b82f6; margin: 16px 0;">
                    ${stats.bioShieldActive}
                </div>
                <p style="color: #6b7280;">Active Bio-Shield Applications</p>
                <div style="margin-top: 20px; padding: 16px; background: #eff6ff; border-radius: 8px;">
                    <p style="font-size: 0.9em; color: #1e40af;">
                        Bio-Shield reduces spoilage by 67% during transit
                    </p>
                </div>
            </div>
            
            <div class="shipment-card" style="border-left: 4px solid #f59e0b;">
                <h3 style="color: #f59e0b; margin-bottom: 16px;">📡 Network Status</h3>
                <div style="margin: 20px 0;">
                    <div style="display: flex; justify-content: space-between; margin: 12px 0;">
                        <span>🌐 Online:</span>
                        <strong>${shipments.filter((s) => s.networkStatus === "online").length}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 12px 0;">
                        <span>📡 Lokoja Gap (Offline):</span>
                        <strong>${shipments.filter((s) => s.networkStatus === "offline").length}</strong>
                    </div>
                </div>
                <div style="margin-top: 20px; padding: 16px; background: #fef3c7; border-radius: 8px;">
                    <p style="font-size: 0.9em; color: #92400e;">
                        SD caching ensures zero data loss in offline zones
                    </p>
                </div>
            </div>
        </div>
        
        <div class="shipment-card" style="margin-top: 20px; border-left: 4px solid #10b981;">
            <h3 style="margin-bottom: 16px;">🎯 Impact Summary</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 20px;">
                <div>
                    <div style="font-size: 2em; font-weight: bold; color: #10b981;">${shipments.reduce((sum, s) => sum + s.crateCount, 0).toLocaleString()}</div>
                    <div style="color: #6b7280; font-size: 0.9em;">Total Crates Monitored</div>
                </div>
                <div>
                    <div style="font-size: 2em; font-weight: bold; color: #10b981;">~${(shipments.reduce((sum, s) => sum + s.crateCount, 0) * 0.45).toFixed(0)}</div>
                    <div style="color: #6b7280; font-size: 0.9em;">Crates Saved from Loss</div>
                </div>
                <div>
                    <div style="font-size: 2em; font-weight: bold; color: #10b981;">₦${((shipments.reduce((sum, s) => sum + s.crateCount, 0) * 8500 * 0.45) / 1000000).toFixed(1)}M</div>
                    <div style="color: #6b7280; font-size: 0.9em;">Economic Value Protected</div>
                </div>
            </div>
        </div>
    `;
}

// ========== VIEW ALERTS FUNCTION ==========
function viewAlerts(shipmentId) {
  const shipment = getShipmentById(shipmentId);

  if (!shipment || !shipment.alerts || shipment.alerts.length === 0) {
    alert("No alerts found for this shipment.");
    return;
  }

  // Create a simple alert modal
  const alertModal = document.createElement("div");
  alertModal.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5); display: flex; align-items: center;
    justify-content: center; z-index: 10000;
  `;

  let alertsHtml = shipment.alerts
    .map((alert) => {
      const severityDisplay = getAlertSeverityDisplay(alert.severity);
      return `
      <div style="padding: 16px; background: ${alert.severity === "red" ? "#fef2f2" : "#fffbeb"}; 
                  border-left: 4px solid ${alert.severity === "red" ? "#ef4444" : "#f59e0b"}; 
                  margin-bottom: 12px; border-radius: 6px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span style="font-size: 20px;">${severityDisplay.icon}</span>
          <strong style="color: #111827;">${alert.type}</strong>
          <span style="margin-left: auto; font-size: 12px; color: #6b7280;">
            ${formatTimestamp(alert.timestamp)}
          </span>
        </div>
        <div style="color: #374151; margin-bottom: 8px;">${alert.message}</div>
        <div style="font-size: 12px; color: #6b7280;">
          📍 ${alert.location}
          ${alert.smsStatus ? ` • 📱 SMS: ${alert.smsStatus}` : ""}
          ${alert.driverResponse ? ` • ✅ Driver: ${alert.driverResponse}` : ""}
        </div>
      </div>
    `;
    })
    .join("");

  alertModal.innerHTML = `
    <div style="background: white; padding: 24px; border-radius: 12px; max-width: 600px; 
                max-height: 80vh; overflow-y: auto; width: 90%;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #111827;">🚨 Alert History - ${shipmentId}</h2>
        <button onclick="this.closest('div[style*=fixed]').remove()" 
                style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">
          ×
        </button>
      </div>
      ${alertsHtml}
      <button onclick="this.closest('div[style*=fixed]').remove()" 
              class="btn-primary" style="width: 100%; margin-top: 16px;">
        Close
      </button>
    </div>
  `;

  document.body.appendChild(alertModal);

  // Close on background click
  alertModal.addEventListener("click", function (e) {
    if (e.target === alertModal) {
      alertModal.remove();
    }
  });
}

// ========== SETTINGS VIEW ==========
function renderSettingsView() {
  const container = document.getElementById("shipmentsContainer");
  container.innerHTML = `
        <div class="shipment-card">
            <h3 style="margin-bottom: 20px; color: #1f2937;">⚙️ Alert Configuration</h3>
            
            <div class="form-group">
                <label>🌡️ Temperature Alert Threshold</label>
                <input type="number" value="28" class="form-control" disabled>
                <small style="color: #6b7280;">Alert when temperature exceeds this value (°C)</small>
            </div>
            
            <div class="form-group">
                <label>💨 Gas Level Alert Threshold</label>
                <input type="number" value="300" class="form-control" disabled>
                <small style="color: #6b7280;">Alert when gas level exceeds this value (ppm)</small>
            </div>
            
            <div class="form-group">
                <label>📧 Email Notifications</label>
                <input type="email" value="vendor@example.com" class="form-control" disabled>
                <small style="color: #6b7280;">Receive alerts at this email address</small>
            </div>
            
            <div class="form-group">
                <label style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" checked disabled>
                    Enable real-time SMS alerts
                </label>
            </div>
            
            <div class="form-group">
                <label style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" checked disabled>
                    Auto-generate freshness reports for Green shipments
                </label>
            </div>
            
            <button class="btn-primary" style="margin-top: 20px; opacity: 0.6; cursor: not-allowed;" disabled>
                Save Settings (Demo Mode)
            </button>
        </div>
        
        <div class="shipment-card" style="margin-top: 20px;">
            <h3 style="margin-bottom: 20px; color: #1f2937;">📊 Hardware Workflow Thresholds</h3>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px;">
                <div style="margin: 12px 0;">
                    <strong style="color: #10b981;">🟢 Safe (Green):</strong> Temp 12-20°C, Gas &lt; 100ppm
                </div>
                <div style="margin: 12px 0;">
                    <strong style="color: #f59e0b;">🟠 Warning (Orange):</strong> Temp 21-27°C, Gas 100-300ppm
                </div>
                <div style="margin: 12px 0;">
                    <strong style="color: #ef4444;">🔴 Danger (Red):</strong> Temp &gt; 28°C, Gas &gt; 300ppm
                </div>
            </div>
            <p style="margin-top: 16px; color: #6b7280; font-size: 0.9em;">
                These thresholds are calibrated for tomato transport based on agricultural research.
            </p>
        </div>
    `;
}

// ========== NOTIFICATION HELPER ==========
function showNotification(message) {
  // Create notification element
  const notification = document.createElement("div");
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        font-weight: 600;
        animation: slideInRight 0.3s ease-out;
        max-width: 350px;
    `;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = "slideOutRight 0.3s ease-out";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ========== WHATSAPP DEMO MODAL ==========
function showWhatsAppDemo() {
  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.7); display: flex; align-items: center;
    justify-content: center; z-index: 10001; animation: fadeIn 0.3s;
  `;

  modal.innerHTML = `
    <div style="background: white; border-radius: 16px; max-width: 450px; width: 90%; 
                max-height: 85vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
      <!-- WhatsApp Header -->
      <div style="background: #128C7E; color: white; padding: 16px 20px; border-radius: 16px 16px 0 0; display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 32px;">💬</div>
        <div style="flex: 1;">
          <div style="font-weight: 600; font-size: 16px;">QOOA Orders</div>
          <div style="font-size: 12px; opacity: 0.9;">online</div>
        </div>
        <button onclick="this.closest('div[style*=fixed]').remove()" 
                style="background: rgba(255,255,255,0.2); border: none; color: white; 
                       width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 20px;">
          ×
        </button>
      </div>

      <!-- Chat Messages -->
      <div style="padding: 24px; background: #ECE5DD; min-height: 400px;">
        
        <!-- Vendor Message 1 -->
        <div style="margin-bottom: 16px; display: flex; justify-content: flex-end;">
          <div style="background: #DCF8C6; padding: 12px 16px; border-radius: 12px 12px 0 12px; 
                      max-width: 75%; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
            <div style="font-size: 14px; color: #000;">
              Hi QOOA, I need 400 crates from Kano to Mile 12 Market. With Bio-Shield. Thursday delivery.
            </div>
            <div style="font-size: 11px; color: #667781; margin-top: 4px; text-align: right;">
              9:45 AM
            </div>
          </div>
        </div>

        <!-- QOOA Auto-Response -->
        <div style="margin-bottom: 16px; display: flex;">
          <div style="background: white; padding: 12px 16px; border-radius: 12px 12px 12px 0; 
                      max-width: 80%; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
            <div style="font-size: 14px; color: #000; line-height: 1.5;">
              ✅ <strong>Order Confirmed!</strong><br><br>
              📦 <strong>Shipment ID:</strong> SHP-004<br>
              🚛 <strong>Truck:</strong> TRK-245<br>
              📍 <strong>Route:</strong> Kano → Mile 12<br>
              📊 <strong>Crates:</strong> 400 (Bio-Shield applied)<br>
              🛡️ <strong>Protection:</strong> Active<br><br>
              📅 <strong>Est. Delivery:</strong> Thursday, 3:00 PM<br><br>
              🔗 Track your shipment: <span style="color: #128C7E; text-decoration: underline;">qooa.ng/track/SHP-004</span><br><br>
              💰 <strong>Amount:</strong> ₦80,000<br>
              (Device rental + Bio-Shield)
            </div>
            <div style="font-size: 11px; color: #667781; margin-top: 4px;">
              9:45 AM
            </div>
          </div>
        </div>

        <!-- System Alert Example -->
        <div style="margin-bottom: 16px; display: flex;">
          <div style="background: #FFF4E5; padding: 12px 16px; border-radius: 12px 12px 12px 0; 
                      max-width: 80%; border-left: 3px solid #f59e0b; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
            <div style="font-size: 14px; color: #000; line-height: 1.5;">
              🚨 <strong>Live Update - SHP-004</strong><br><br>
              Your shipment passed Kaduna checkpoint.<br>
              📊 Status: <span style="color: #10b981;">●</span> All Green<br>
              🌡️ Temp: 19.5°C<br>
              💨 Gas: 88 ppm<br>
              💧 Humidity: 87%<br><br>
              ETA: Thursday 3:00 PM
            </div>
            <div style="font-size: 11px; color: #667781; margin-top: 4px;">
              2:30 PM
            </div>
          </div>
        </div>

        <!-- Vendor Response -->
        <div style="margin-bottom: 16px; display: flex; justify-content: flex-end;">
          <div style="background: #DCF8C6; padding: 12px 16px; border-radius: 12px 12px 0 12px; 
                      max-width: 75%; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
            <div style="font-size: 14px; color: #000;">
              Perfect! Thank you 🙏
            </div>
            <div style="font-size: 11px; color: #667781; margin-top: 4px; text-align: right;">
              2:32 PM ✓✓
            </div>
          </div>
        </div>

      </div>

      <!-- Info Footer -->
      <div style="padding: 20px; background: #f3f4f6; border-radius: 0 0 16px 16px;">
        <div style="font-size: 13px; color: #374151; margin-bottom: 12px; font-weight: 600;">
          💡 Why WhatsApp?
        </div>
        <div style="font-size: 12px; color: #6b7280; line-height: 1.6;">
          ✅ 180M Africans already use it<br>
          ✅ Works on ₦15,000 basic phones<br>
          ✅ Voice message support<br>
          ✅ Zero training needed<br>
          ✅ Real-time order updates
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close on background click
  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// ========== CLOSE MODAL FUNCTION (Global Access) ==========
function closeTruckModal() {
  document.getElementById("truckModal").style.display = "none";
}

function closeOrderModal() {
  document.getElementById("orderModal").style.display = "none";
}

// Make functions globally accessible for inline onclick handlers
window.openTruckModal = openTruckModal;
window.closeTruckModal = closeTruckModal;
window.closeOrderModal = closeOrderModal;
window.generateFreshnessReport = generateFreshnessReport;
window.switchView = switchView;
window.getStatusColor = getStatusColor;
window.getStatusBadgeClass = getStatusBadgeClass;
window.getRelativeTime = getRelativeTime;
window.showWhatsAppDemo = showWhatsAppDemo;
