// QOOA Vendor Portal - Main Application Logic

// ========== CONFIGURATION ==========
const API_BASE_URL = "/api"; // Replace with actual backend URL
const PRICE_REFRESH_INTERVAL = 60000; // 1 minute

// ========== STATE MANAGEMENT ==========
let vendorSession = null;
let currentPrice = 0;
let activeOrders = [];
let selectedRating = 0;
let currentOrderForFeedback = null;

// ========== INITIALIZATION ==========
document.addEventListener("DOMContentLoaded", function () {
  checkVendorAuth();
  initializePortal();
  setupEventListeners();
  startPriceUpdates();
});

function checkVendorAuth() {
  const session = localStorage.getItem("qooa_vendor_session");
  if (!session) {
    window.location.href = "vendor-onboarding.html";
    return;
  }
  vendorSession = JSON.parse(session);
}

function initializePortal() {
  // Display vendor info
  document.getElementById("vendorName").textContent = vendorSession.vendorName;

  // Load current data
  fetchCurrentPrice();
  fetchVendorOrders();
  fetchVendorStats();

  // Set minimum delivery date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById("deliveryDate").min = tomorrow
    .toISOString()
    .split("T")[0];
  document.getElementById("deliveryDate").value = tomorrow
    .toISOString()
    .split("T")[0];
}

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
  // Quantity controls
  document
    .getElementById("decreaseQty")
    ?.addEventListener("click", () => adjustQuantity(-1));
  document
    .getElementById("increaseQty")
    ?.addEventListener("click", () => adjustQuantity(1));
  document
    .getElementById("crateQuantity")
    ?.addEventListener("input", updateOrderSummary);

  // Place order
  document
    .getElementById("placeOrderBtn")
    ?.addEventListener("click", placeOrder);

  // Subscription
  document
    .getElementById("setupSubscriptionBtn")
    ?.addEventListener("click", openSubscriptionModal);
  document
    .getElementById("subscriptionForm")
    ?.addEventListener("submit", handleSubscription);

  // Order filters
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      document
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      filterOrders(this.dataset.status);
    });
  });

  // Star rating
  document.querySelectorAll(".star").forEach((star) => {
    star.addEventListener("click", function () {
      selectedRating = parseInt(this.dataset.rating);
      updateStarDisplay();
    });
  });

  // Feedback submission
  document
    .getElementById("submitFeedbackBtn")
    ?.addEventListener("click", submitFeedback);

  // Logout
  document.getElementById("logoutBtn")?.addEventListener("click", logout);

  // Modal closes
  document.querySelectorAll(".modal-close").forEach((btn) => {
    btn.addEventListener("click", closeModal);
  });

  window.addEventListener("click", function (e) {
    if (e.target.classList.contains("modal")) {
      closeModal();
    }
  });
}

// ========== PRICE MANAGEMENT ==========
async function fetchCurrentPrice() {
  try {
    // In production, fetch from API
    const response = await getPriceFromAPI();
    currentPrice = response.price;

    // Update UI
    document.getElementById("currentPrice").textContent =
      formatCurrency(currentPrice);
    document.getElementById("summaryUnitPrice").textContent =
      formatCurrency(currentPrice);
    updateOrderSummary();
  } catch (error) {
    console.error("Error fetching price:", error);
    // Fallback price
    currentPrice = 18500;
    document.getElementById("currentPrice").textContent =
      formatCurrency(currentPrice);
    updateOrderSummary();
  }
}

async function getPriceFromAPI() {
  // Simulated API call - Replace with actual backend
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Get price from localStorage or use default
  const storedPrice = localStorage.getItem("qooa_current_price");
  return {
    price: storedPrice ? parseInt(storedPrice) : 18500,
    lastUpdated: new Date().toISOString(),
    trend: "stable", // up, down, stable
  };
}

function startPriceUpdates() {
  setInterval(fetchCurrentPrice, PRICE_REFRESH_INTERVAL);
}

// ========== ORDER MANAGEMENT ==========
function adjustQuantity(delta) {
  const input = document.getElementById("crateQuantity");
  let value = parseInt(input.value) || 1;
  value = Math.max(1, Math.min(100, value + delta));
  input.value = value;
  updateOrderSummary();
}

function updateOrderSummary() {
  const quantity =
    parseInt(document.getElementById("crateQuantity").value) || 1;
  const total = quantity * currentPrice;

  document.getElementById("summaryQty").textContent = quantity;
  document.getElementById("summaryTotal").textContent = formatCurrency(total);
}

async function placeOrder() {
  const quantity = parseInt(document.getElementById("crateQuantity").value);
  const deliveryTime = document.getElementById("deliveryTime").value;
  const deliveryDate = document.getElementById("deliveryDate").value;

  if (!deliveryDate) {
    alert(t("order-placed") || "Please select a delivery date");
    return;
  }

  const orderData = {
    vendorId: vendorSession.vendorId,
    vendorName: vendorSession.vendorName,
    marketCluster: vendorSession.marketCluster,
    stallNumber: vendorSession.stallNumber,
    crateQuantity: quantity,
    pricePerCrate: currentPrice,
    totalAmount: quantity * currentPrice,
    deliveryTime,
    deliveryDate,
    status: "confirmed",
    orderedAt: new Date().toISOString(),
  };

  try {
    const response = await createOrder(orderData);

    if (response.success) {
      // Show payment modal
      showPaymentModal(response.order);

      // Refresh orders
      fetchVendorOrders();

      // Reset form
      document.getElementById("crateQuantity").value = 1;
      updateOrderSummary();
    }
  } catch (error) {
    console.error("Order error:", error);
    alert("Failed to place order. Please try again.");
  }
}

async function createOrder(orderData) {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 800));

  const orderId = "ORD" + Date.now().toString().slice(-8);
  const order = {
    ...orderData,
    orderId,
    paymentStatus: "pending",
    trackingStages: [
      {
        stage: "confirmed",
        timestamp: new Date().toISOString(),
        completed: true,
      },
    ],
  };

  // Store in localStorage
  const orders = JSON.parse(localStorage.getItem("qooa_vendor_orders") || "[]");
  orders.unshift(order);
  localStorage.setItem("qooa_vendor_orders", JSON.stringify(orders));

  return {
    success: true,
    order,
    message: "Order placed successfully",
  };
}

async function fetchVendorOrders() {
  try {
    // In production, fetch from API
    const orders = JSON.parse(
      localStorage.getItem("qooa_vendor_orders") || "[]",
    );
    activeOrders = orders.filter((o) => o.vendorId === vendorSession.vendorId);

    renderOrders("active");
    updateActiveOrdersCount();
  } catch (error) {
    console.error("Error fetching orders:", error);
  }
}

function renderOrders(filter) {
  const container = document.getElementById("ordersContainer");
  if (!container) return;

  let filteredOrders = activeOrders;
  if (filter === "active") {
    filteredOrders = activeOrders.filter((o) =>
      ["confirmed", "in-transit", "at-hub", "out-for-delivery"].includes(
        o.status,
      ),
    );
  } else if (filter === "completed") {
    filteredOrders = activeOrders.filter((o) => o.status === "delivered");
  }

  if (filteredOrders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>📦</p>
        <p>${filter === "active" ? "No active orders" : "No completed orders"}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredOrders
    .map((order) => createOrderCard(order))
    .join("");

  // Add click handlers
  container.querySelectorAll(".order-card").forEach((card, index) => {
    card.addEventListener("click", () =>
      showOrderDetails(filteredOrders[index]),
    );
  });
}

function createOrderCard(order) {
  const statusInfo = getOrderStatusInfo(order.status);
  const showFeedback = order.status === "delivered" && !order.feedback;

  return `
    <div class="order-card" data-order-id="${order.orderId}">
      <div class="order-header">
        <div>
          <h3>${order.orderId}</h3>
          <p class="order-date">${formatDate(order.orderedAt)}</p>
        </div>
        <span class="status-badge status-${order.status}">${statusInfo.text}</span>
      </div>
      <div class="order-body">
        <div class="order-info">
          <span>📦 ${order.crateQuantity} ${order.crateQuantity === 1 ? "crate" : "crates"}</span>
          <span>💰 ${formatCurrency(order.totalAmount)}</span>
          <span>📅 ${formatDate(order.deliveryDate)}</span>
        </div>
        ${
          order.status !== "confirmed"
            ? `
          <div class="tracking-progress">
            ${createTrackingBar(order)}
          </div>
        `
            : ""
        }
        ${
          showFeedback
            ? `
          <button class="btn-feedback" onclick="openFeedbackModal('${order.orderId}')">
            ⭐ Rate This Order
          </button>
        `
            : ""
        }
      </div>
    </div>
  `;
}

function createTrackingBar(order) {
  const stages = [
    { key: "confirmed", label: "Confirmed" },
    { key: "in-transit", label: "In Transit" },
    { key: "at-hub", label: "At Hub" },
    { key: "out-for-delivery", label: "Out for Delivery" },
    { key: "delivered", label: "Delivered" },
  ];

  const currentIndex = stages.findIndex((s) => s.key === order.status);

  return `
    <div class="tracking-stages">
      ${stages
        .map(
          (stage, index) => `
        <div class="tracking-stage ${index <= currentIndex ? "completed" : ""}">
          <div class="stage-dot"></div>
          <span class="stage-label">${stage.label}</span>
        </div>
      `,
        )
        .join('<div class="stage-line"></div>')}
    </div>
  `;
}

function getOrderStatusInfo(status) {
  const statusMap = {
    confirmed: { text: t("order-confirmed"), color: "blue" },
    "in-transit": { text: t("in-transit-north"), color: "orange" },
    "at-hub": { text: t("arrived-lagos"), color: "purple" },
    "out-for-delivery": { text: t("out-for-delivery"), color: "green" },
    delivered: { text: t("delivered"), color: "green" },
  };

  return statusMap[status] || { text: status, color: "gray" };
}

function filterOrders(status) {
  renderOrders(status);
}

function updateActiveOrdersCount() {
  const activeCount = activeOrders.filter((o) =>
    ["confirmed", "in-transit", "at-hub", "out-for-delivery"].includes(
      o.status,
    ),
  ).length;

  document.getElementById("activeOrders").textContent = activeCount;
}

// ========== ORDER DETAILS MODAL ==========
function showOrderDetails(order) {
  const modal = document.getElementById("orderModal");
  const content = document.getElementById("orderDetailContent");

  content.innerHTML = `
    <div class="order-detail-section">
      <h3>📋 Order Information</h3>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">Order ID:</span>
          <span class="detail-value">${order.orderId}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Status:</span>
          <span class="status-badge status-${order.status}">${getOrderStatusInfo(order.status).text}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Quantity:</span>
          <span class="detail-value">${order.crateQuantity} crates</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Total Amount:</span>
          <span class="detail-value">${formatCurrency(order.totalAmount)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Delivery Date:</span>
          <span class="detail-value">${formatDate(order.deliveryDate)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Delivery Time:</span>
          <span class="detail-value">${order.deliveryTime}</span>
        </div>
      </div>
    </div>
    
    <div class="order-detail-section">
      <h3>🌡️ ${t("quality-guaranteed")}</h3>
      ${
        order.telemetry
          ? `
        <div class="telemetry-summary">
          <p>${t("temp-controlled")}: <strong>${order.telemetry.avgTemp}°C</strong></p>
          <p>✅ Freshness Score: <strong>${order.telemetry.freshnessScore}/100</strong></p>
        </div>
      `
          : `
        <p>Quality data will be available during transit</p>
      `
      }
    </div>
    
    <div class="order-detail-section">
      <h3>🚚 Tracking History</h3>
      <div class="tracking-timeline">
        ${createTrackingTimeline(order)}
      </div>
    </div>
    
    ${
      order.paymentStatus === "pending"
        ? `
      <button class="btn-primary btn-large" onclick="showPaymentModal(${JSON.stringify(order).replace(/"/g, "&quot;")})">
        💳 Complete Payment
      </button>
    `
        : ""
    }
  `;

  modal.style.display = "flex";
}

function createTrackingTimeline(order) {
  const stages = order.trackingStages || [];

  if (stages.length === 0) {
    return "<p>No tracking information available yet</p>";
  }

  return stages
    .map(
      (stage) => `
    <div class="timeline-item ${stage.completed ? "completed" : ""}">
      <div class="timeline-dot"></div>
      <div class="timeline-content">
        <strong>${getOrderStatusInfo(stage.stage).text}</strong>
        <span class="timeline-time">${formatDateTime(stage.timestamp)}</span>
      </div>
    </div>
  `,
    )
    .join("");
}

// ========== PAYMENT ==========
function showPaymentModal(order) {
  const modal = document.getElementById("paymentModal");
  const content = document.getElementById("paymentContent");

  content.innerHTML = `
    <div class="payment-summary">
      <h3>Order Summary</h3>
      <div class="summary-row">
        <span>Order ID:</span>
        <strong>${order.orderId}</strong>
      </div>
      <div class="summary-row">
        <span>Amount:</span>
        <strong>${formatCurrency(order.totalAmount)}</strong>
      </div>
    </div>
    
    <div class="payment-methods">
      <h3>${t("payment-method")}</h3>
      
      <button class="payment-option" onclick="initiatePaystack('${order.orderId}', ${order.totalAmount})">
        <span class="payment-icon">💳</span>
        <div>
          <strong>${t("card-payment")}</strong>
          <p>Pay with Paystack (Card, Bank Transfer, USSD)</p>
        </div>
      </button>
      
      <button class="payment-option" onclick="showBankTransfer('${order.orderId}', ${order.totalAmount})">
        <span class="payment-icon">🏦</span>
        <div>
          <strong>${t("bank-transfer")}</strong>
          <p>Direct Bank Transfer</p>
        </div>
      </button>
    </div>
    
    <div class="payment-note">
      <p>⚠️ Your order will be confirmed after payment verification</p>
    </div>
  `;

  modal.style.display = "flex";
}

function initiatePaystack(orderId, amount) {
  // In production, integrate Paystack API
  alert(
    `Initiating Paystack payment for ${formatCurrency(amount)}\nOrder ID: ${orderId}\n\n(Paystack integration required)`,
  );

  // Simulate successful payment
  setTimeout(() => {
    markPaymentComplete(orderId);
    closeModal();
  }, 2000);
}

function showBankTransfer(orderId, amount) {
  const content = document.getElementById("paymentContent");

  content.innerHTML = `
    <div class="bank-details">
      <h3>Bank Transfer Details</h3>
      <div class="bank-info">
        <div class="bank-item">
          <span>Bank Name:</span>
          <strong>First Bank Nigeria</strong>
        </div>
        <div class="bank-item">
          <span>Account Name:</span>
          <strong>QOOA Technologies Ltd</strong>
        </div>
        <div class="bank-item">
          <span>Account Number:</span>
          <strong>1234567890</strong>
        </div>
        <div class="bank-item">
          <span>Amount:</span>
          <strong>${formatCurrency(amount)}</strong>
        </div>
        <div class="bank-item">
          <span>Reference:</span>
          <strong>${orderId}</strong>
        </div>
      </div>
      
      <div class="transfer-note">
        <p>⚠️ Please use <strong>${orderId}</strong> as your transfer reference</p>
        <p>Payment confirmation may take 5-10 minutes</p>
      </div>
      
      <button class="btn-primary btn-large" onclick="confirmBankTransfer('${orderId}')">
        I Have Completed the Transfer
      </button>
    </div>
  `;
}

function confirmBankTransfer(orderId) {
  alert(
    "Thank you! We will verify your payment and confirm your order shortly.",
  );
  closeModal();
}

function markPaymentComplete(orderId) {
  const orders = JSON.parse(localStorage.getItem("qooa_vendor_orders") || "[]");
  const orderIndex = orders.findIndex((o) => o.orderId === orderId);

  if (orderIndex !== -1) {
    orders[orderIndex].paymentStatus = "completed";
    orders[orderIndex].paidAt = new Date().toISOString();
    localStorage.setItem("qooa_vendor_orders", JSON.stringify(orders));

    fetchVendorOrders();
  }
}

// ========== SUBSCRIPTION ==========
function openSubscriptionModal() {
  document.getElementById("subscriptionModal").style.display = "flex";
}

async function handleSubscription(e) {
  e.preventDefault();

  const subscriptionData = {
    vendorId: vendorSession.vendorId,
    crateQuantity: parseInt(document.getElementById("subCrates").value),
    frequency: document.getElementById("subFrequency").value,
    deliveryTime: document.getElementById("subTime").value,
    startDate: new Date().toISOString(),
    active: true,
  };

  try {
    await createSubscription(subscriptionData);
    alert("Subscription activated successfully!");
    closeModal();
    updateSubscriptionStatus(subscriptionData);
  } catch (error) {
    console.error("Subscription error:", error);
    alert("Failed to create subscription. Please try again.");
  }
}

async function createSubscription(data) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  localStorage.setItem("qooa_vendor_subscription", JSON.stringify(data));
  return { success: true };
}

function updateSubscriptionStatus(subscription) {
  const container = document.getElementById("subscriptionStatus");
  if (container) {
    container.innerHTML = `
      <div class="active-subscription">
        <h4>✅ Active Subscription</h4>
        <p>${subscription.crateQuantity} crates every ${subscription.frequency}</p>
        <p>Delivery time: ${subscription.deliveryTime}</p>
        <button class="btn-secondary" onclick="cancelSubscription()">Cancel Subscription</button>
      </div>
    `;
  }
}

function cancelSubscription() {
  if (confirm("Are you sure you want to cancel your subscription?")) {
    localStorage.removeItem("qooa_vendor_subscription");
    document.getElementById("subscriptionStatus").innerHTML = `
      <p data-lang="no-subscription">No active subscription</p>
      <button class="btn-secondary" id="setupSubscriptionBtn" data-lang="setup-subscription">
        Setup Subscription
      </button>
    `;
    document
      .getElementById("setupSubscriptionBtn")
      .addEventListener("click", openSubscriptionModal);
  }
}

// ========== FEEDBACK ==========
function openFeedbackModal(orderId) {
  currentOrderForFeedback = orderId;
  selectedRating = 0;
  updateStarDisplay();
  document.getElementById("feedbackComments").value = "";
  document.getElementById("damagePhoto").value = "";
  document.getElementById("feedbackModal").style.display = "flex";
}

function updateStarDisplay() {
  document.querySelectorAll(".star").forEach((star, index) => {
    if (index < selectedRating) {
      star.style.opacity = "1";
      star.style.filter = "none";
    } else {
      star.style.opacity = "0.3";
      star.style.filter = "grayscale(100%)";
    }
  });
}

async function submitFeedback() {
  if (selectedRating === 0) {
    alert("Please select a rating");
    return;
  }

  const comments = document.getElementById("feedbackComments").value;
  const damagePhoto = document.getElementById("damagePhoto").files[0];

  const feedbackData = {
    orderId: currentOrderForFeedback,
    vendorId: vendorSession.vendorId,
    rating: selectedRating,
    comments,
    hasDamageReport: !!damagePhoto,
    submittedAt: new Date().toISOString(),
  };

  try {
    await saveFeedback(feedbackData, damagePhoto);
    alert("Thank you for your feedback!");
    closeModal();
    fetchVendorOrders();
  } catch (error) {
    console.error("Feedback error:", error);
    alert("Failed to submit feedback. Please try again.");
  }
}

async function saveFeedback(data, photo) {
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Update order with feedback
  const orders = JSON.parse(localStorage.getItem("qooa_vendor_orders") || "[]");
  const orderIndex = orders.findIndex((o) => o.orderId === data.orderId);

  if (orderIndex !== -1) {
    orders[orderIndex].feedback = data;
    localStorage.setItem("qooa_vendor_orders", JSON.stringify(orders));
  }

  return { success: true };
}

// ========== VENDOR STATS ==========
async function fetchVendorStats() {
  try {
    const orders = activeOrders;
    const completedOrders = orders.filter((o) => o.status === "delivered");

    // Calculate quality score
    const feedbackScores = completedOrders
      .filter((o) => o.feedback)
      .map((o) => o.feedback.rating);

    const avgScore =
      feedbackScores.length > 0
        ? (
            feedbackScores.reduce((a, b) => a + b, 0) / feedbackScores.length
          ).toFixed(1)
        : 5.0;

    document.getElementById("qualityScore").textContent = avgScore;
  } catch (error) {
    console.error("Error fetching stats:", error);
  }
}

// ========== UTILITY FUNCTIONS ==========
function formatCurrency(amount) {
  return "₦" + amount.toLocaleString("en-NG");
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function closeModal() {
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.style.display = "none";
  });
}

function logout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("qooa_vendor_session");
    window.location.href = "vendor-onboarding.html";
  }
}
