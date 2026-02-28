// QOOA Control Tower - Dashboard Logic

// ========== NOTIFICATION SYSTEM ==========
function showNotification(message, type = 'success') {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
  `;

  toastContainer.appendChild(toast);

  // Animate in
  setTimeout(() => toast.classList.add('toast-show'), 10);

  // Remove after 4 seconds
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

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

      // Get the navigation text (from the span, not the emoji)
      const navText = this.querySelector("span:last-child").textContent.trim();

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

// ========== SWITCH VIEW ==========
function switchView(viewName) {
  console.log("switchView called with:", viewName);
  const mainContent = document.querySelector(".main-content");
  
  try {
    switch (viewName) {
      case "Dashboard":
        console.log("Rendering Dashboard view");
        renderDashboardView();
        break;
      case "Shipments":
        console.log("Rendering Shipments view");
        renderShipmentsView();
        break;
      case "Live Telemetry":
        renderTelemetryView();
        break;
      case "Reports":
        renderReportsView();
        break;
      case "Settings":
        renderSettingsView();
        break;
      default:
        renderDashboardView();
    }
  } catch (error) {
    console.error("Error in switchView:", error);
    showNotification("An error occurred while switching views. Please try again.", "error");
  }
}

// ========== RENDER SHIPMENTS VIEW ==========
function renderShipmentsView() {
  const mainContent = document.querySelector(".main-content");
  
  mainContent.innerHTML = `
    <header class="dashboard-header">
      <div class="header-left">
        <h1>📦 All Shipments</h1>
        <p>Manage and track all shipments</p>
      </div>
      <div class="header-right">
        <button id="newOrderBtn" class="btn-primary">➕ New Order</button>
      </div>
    </header>
    
    <section class="shipments-section">
      <div id="shipmentsContainer">
        <div class="loading">Loading shipments...</div>
      </div>
    </section>
  `;
  
  setupDynamicEventListeners();
  renderShipments();
}

// ========== RENDER TELEMETRY VIEW ==========
function renderTelemetryView() {
  const mainContent = document.querySelector(".main-content");
  const shipments = getShipments();
  
  mainContent.innerHTML = `
    <header class="dashboard-header">
      <div class="header-left">
        <h1>📡 Live Telemetry</h1>
        <p>Real-time sensor monitoring for all shipments</p>
      </div>
    </header>
    
    <section class="shipments-section">
      <div class="telemetry-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
        ${shipments.map(shipment => {
          const telemetry = getLatestTelemetry(shipment.id);
          if (!telemetry) return '';
          
          const tempStatus = getTempStatus(telemetry.temperature);
          const gasStatus = getGasStatus(telemetry.gasLevel);
          
          return `
            <div class="sensor-card" style="padding: 20px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div class="shipment-id" style="font-weight: bold;">${shipment.id}</div>
                <span class="badge ${shipment.qualityStatus === 'Green' ? 'badge-green' : shipment.qualityStatus === 'Orange' ? 'badge-orange' : 'badge-red'}">${shipment.qualityStatus}</span>
              </div>
              <div style="font-size: 12px; color: #6b7280; margin-bottom: 16px;">
                🚛 ${shipment.truckId}<br>
                📍 ${telemetry.location.name}
              </div>
              <div style="display: grid; gap: 12px;">
                <div>
                  <div style="font-size: 11px; color: #6b7280;">Temperature</div>
                  <div class="sensor-value ${tempStatus.class}" style="font-size: 24px; font-weight: bold;">${telemetry.temperature}°C</div>
                </div>
                <div>
                  <div style="font-size: 11px; color: #6b7280;">Ethylene Gas</div>
                  <div class="sensor-value ${gasStatus.class}" style="font-size: 24px; font-weight: bold;">${telemetry.gasLevel} ppm</div>
                </div>
                <div>
                  <div style="font-size: 11px; color: #6b7280;">Humidity</div>
                  <div style="font-size: 24px; font-weight: bold;">${telemetry.humidity}%</div>
                </div>
                <button class="btn-small" onclick="openTruckModal('${shipment.id}')" style="margin-top: 8px;">
                  View Details
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

// ========== RENDER REPORTS VIEW ==========
function renderReportsView() {
  const mainContent = document.querySelector(".main-content");
  const shipments = getShipments();
  const stats = getStats();
  
  mainContent.innerHTML = `
    <header class="dashboard-header">
      <div class="header-left">
        <h1>📋 Reports & Analytics</h1>
        <p>Performance metrics and quality reports</p>
      </div>
    </header>
    
    <section class="stats-section">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📦</div>
          <div class="stat-info">
            <h3>${stats.totalShipments}</h3>
            <p>Total Shipments</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🚛</div>
          <div class="stat-info">
            <h3>${stats.inTransit}</h3>
            <p>In Transit</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-info">
            <h3>${stats.completed}</h3>
            <p>Completed</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🛡️</div>
          <div class="stat-info">
            <h3>${stats.bioShieldActive}</h3>
            <p>Bio-Shield Active</p>
          </div>
        </div>
      </div>
    </section>
    
    <section class="shipments-section" style="margin-top: 24px;">
      <h2>Quality Reports</h2>
      <div style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid #e5e7eb;">
              <th style="text-align: left; padding: 12px;">Shipment ID</th>
              <th style="text-align: left; padding: 12px;">Route</th>
              <th style="text-align: left; padding: 12px;">Quality Status</th>
              <th style="text-align: left; padding: 12px;">Hub Triage</th>
              <th style="text-align: left; padding: 12px;">Bio-Shield</th>
              <th style="text-align: left; padding: 12px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${shipments.map(shipment => `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px; font-weight: 500;">${shipment.id}</td>
                <td style="padding: 12px;">${shipment.origin} → ${shipment.destination}</td>
                <td style="padding: 12px;">
                  <span class="badge ${shipment.qualityStatus === 'Green' ? 'badge-green' : shipment.qualityStatus === 'Orange' ? 'badge-orange' : 'badge-red'}">${shipment.qualityStatus}</span>
                </td>
                <td style="padding: 12px;">
                  <span class="badge ${getHubTriageDisplay(shipment.hubTriageDecision).class}">${getHubTriageDisplay(shipment.hubTriageDecision).label}</span>
                </td>
                <td style="padding: 12px;">
                  ${shipment.bioShieldApplied ? '✅' : '❌'}
                </td>
                <td style="padding: 12px;">
                  <button class="btn-small" onclick="${shipment.qualityStatus === 'Green' ? `generateFreshnessReport('${shipment.id}')` : 'alert(\'Report unavailable for this shipment\')'}" ${shipment.qualityStatus !== 'Green' ? 'disabled' : ''}>
                    📄 Report
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// ========== RENDER SETTINGS VIEW ==========
function renderSettingsView() {
  const mainContent = document.querySelector(".main-content");
  
  // Load saved settings from localStorage
  const settings = JSON.parse(localStorage.getItem('qooa_settings')) || {
    emailAlerts: true,
    smsAlerts: true,
    whatsappAlerts: false,
    criticalTemp: 28,
    criticalGas: 300
  };
  
  mainContent.innerHTML = `
    <header class="dashboard-header">
      <div class="header-left">
        <h1>⚙️ Settings</h1>
        <p>Configure your dashboard preferences</p>
      </div>
    </header>
    
    <section class="shipments-section">
      <div style="background: white; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-width: 800px;">
        <h3 style="margin-bottom: 20px;">System Configuration</h3>
        
        <form id="settingsForm" style="display: grid; gap: 20px;">
          <div>
            <label style="display: block; font-weight: 500; margin-bottom: 8px;">Notification Preferences</label>
            <label style="display: block; margin-bottom: 8px;">
              <input type="checkbox" id="emailAlerts" ${settings.emailAlerts ? 'checked' : ''}> Email alerts for critical temperature
            </label>
            <label style="display: block; margin-bottom: 8px;">
              <input type="checkbox" id="smsAlerts" ${settings.smsAlerts ? 'checked' : ''}> SMS alerts for gas level warnings
            </label>
            <label style="display: block; margin-bottom: 8px;">
              <input type="checkbox" id="whatsappAlerts" ${settings.whatsappAlerts ? 'checked' : ''}> WhatsApp notifications
            </label>
          </div>
          
          <div>
            <label style="display: block; font-weight: 500; margin-bottom: 8px;">Quality Thresholds</label>
            <div style="display: grid; gap: 12px;">
              <div>
                <label style="display: block; font-size: 13px; color: #6b7280; margin-bottom: 4px;">Critical Temperature (°C)</label>
                <input type="number" id="criticalTemp" value="${settings.criticalTemp}" min="15" max="35" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
              </div>
              <div>
                <label style="display: block; font-size: 13px; color: #6b7280; margin-bottom: 4px;">Critical Gas Level (ppm)</label>
                <input type="number" id="criticalGas" value="${settings.criticalGas}" min="50" max="500" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
              </div>
            </div>
          </div>
          
          <div>
            <label style="display: block; font-weight: 500; margin-bottom: 8px;">Hub Configuration</label>
            <div style="background: #f9fafb; padding: 12px; border-radius: 4px;">
              <p style="font-size: 13px; color: #6b7280; margin-bottom: 8px;">Active Hubs:</p>
              <p style="font-size: 14px;">📍 Kano Hub - Active</p>
              <p style="font-size: 14px;">📍 Jos Hub - Active</p>
            </div>
          </div>
          
          <div style="padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <button type="submit" class="btn-primary" id="saveSettingsBtn">Save Settings</button>
            <button type="button" class="btn-secondary" style="margin-left: 12px;" onclick="resetSettings()">Reset to Default</button>
          </div>
        </form>
      </div>
    </section>
  `;
  
  // Add form submit listener
  setTimeout(() => {
    const settingsForm = document.querySelector('#settingsForm');
    if (settingsForm) {
      settingsForm.addEventListener('submit', saveSettings);
    }
  }, 0);
}

// ========== SETUP DYNAMIC EVENT LISTENERS ==========
function setupDynamicEventListeners() {
  // New Order Button
  const newOrderBtn = document.getElementById("newOrderBtn");
  if (newOrderBtn) {
    newOrderBtn.addEventListener("click", openOrderModal);
  }
}

// ========== UPDATE STATISTICS ==========
function updateStats() {
  const stats = getStats();

  const totalShipmentsEl = document.getElementById("totalShipments");
  const inTransitEl = document.getElementById("inTransit");
  const bioShieldActiveEl = document.getElementById("bioShieldActive");
  const completedEl = document.getElementById("completed");

  if (totalShipmentsEl) totalShipmentsEl.textContent = stats.totalShipments;
  if (inTransitEl) inTransitEl.textContent = stats.inTransit;
  if (bioShieldActiveEl) bioShieldActiveEl.textContent = stats.bioShieldActive;
  if (completedEl) completedEl.textContent = stats.completed;
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

// ========== MODAL FUNCTIONS ==========
function openOrderModal() {
  const modal = document.getElementById("orderModal");
  if (modal) {
    modal.style.display = "flex";
  }
}

function closeOrderModal() {
  const modal = document.getElementById("orderModal");
  if (modal) {
    modal.style.display = "none";
  }
}

function closeTruckModal() {
  const modal = document.getElementById("truckModal");
  if (modal) {
    modal.style.display = "none";
  }
}

function closeAllModals() {
  const modals = document.querySelectorAll(".modal");
  modals.forEach((modal) => {
    modal.style.display = "none";
  });
}

// ========== ADDITIONAL FUNCTIONS ==========
function handleNewOrder(e) {
  e.preventDefault();
  
  const origin = document.getElementById("orderOrigin").value;
  const destination = document.getElementById("orderDestination").value;
  const crates = document.getElementById("orderCrates").value;
  const bioShield = document.getElementById("orderBioShield").checked;
  
  showNotification(`Order placed! ${crates} crates from ${origin} to ${destination} ${bioShield ? '(with Bio-Shield)' : ''}`, 'success');
  
  // Add new order to dashboard
  setTimeout(() => {
    renderDashboard();
  }, 500);
  
  closeOrderModal();
}

function handleLogout() {
  localStorage.removeItem("qooa_session");
  window.location.href = "index.html";
}

function viewAlerts(shipmentId) {
  const shipment = getShipmentById(shipmentId);
  if (shipment && shipment.alerts && shipment.alerts.length > 0) {
    shipment.alerts.forEach((alert) => {
      const type = alert.severity === 'critical' ? 'error' : alert.severity === 'warning' ? 'warning' : 'info';
      showNotification(`${shipment.id}: ${alert.message}`, type);
    });
  } else {
    showNotification(`No alerts for ${shipmentId}`, 'info');
  }
}

function generateFreshnessReport(shipmentId) {
  const shipment = getShipmentById(shipmentId);
  if (shipment) {
    const certId = `FC-${Date.now()}`;
    showNotification(`📄 Freshness Certificate Generated! ID: ${certId}`, 'success');
    console.log(`Certificate Details - ${shipment.id}: Quality ${shipment.qualityStatus}`);
  }
}

function showWhatsAppDemo() {
  showNotification("📱 WhatsApp Demo: Vendors send 'Order 30 crates from Kano to Lagos' - zero app downloads!", 'info');
}

function saveSettings(e) {
  e.preventDefault();
  
  const settings = {
    emailAlerts: document.getElementById('emailAlerts').checked,
    smsAlerts: document.getElementById('smsAlerts').checked,
    whatsappAlerts: document.getElementById('whatsappAlerts').checked,
    criticalTemp: parseInt(document.getElementById('criticalTemp').value),
    criticalGas: parseInt(document.getElementById('criticalGas').value)
  };
  
  localStorage.setItem('qooa_settings', JSON.stringify(settings));
  
  showNotification('Settings saved successfully!', 'success');
}

function resetSettings() {
  const defaultSettings = {
    emailAlerts: true,
    smsAlerts: true,
    whatsappAlerts: false,
    criticalTemp: 28,
    criticalGas: 300
  };
  
  localStorage.setItem('qooa_settings', JSON.stringify(defaultSettings));
  
  // Re-render the settings view
  renderSettingsView();
  
  showNotification('Settings reset to default values!', 'success');
}
