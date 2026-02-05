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
                </div>`;
  });

  container.innerHTML += '</div>';
}
