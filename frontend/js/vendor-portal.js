// QOOA Vendor Portal - Enhanced Logic

// ========== NOTIFICATION SYSTEM ==========
function showNotification(message, type = 'success') {
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
  `;

  toastContainer.appendChild(toast);
  setTimeout(() => toast.classList.add('toast-show'), 10);
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', function() {
  initializeVendorPortal();
  loadCurrentPrice();
  loadVendorStats();
  setupOrderControls();
  setupEventListeners();
});

// ========== VENDOR DATA ==========
function initializeVendorPortal() {
  const vendorData = {
    name: 'Aisha Mohammed',
    stallNumber: 'Stall 12',
    location: 'Mile 12 Market',
    phone: '+234 803 XXX XXXX'
  };
  
  const vendorNameEl = document.getElementById('vendorName');
  if (vendorNameEl) {
    vendorNameEl.textContent = `${vendorData.name} - ${vendorData.stallNumber}`;
  }
}

// ========== LOAD PRICING ==========
function loadCurrentPrice() {
  // Simulate API call
  setTimeout(() => {
    const currentPriceEl = document.getElementById('currentPrice');
    if (currentPriceEl) {
      currentPriceEl.textContent = '₦8,500';
    }
  }, 500);
}

// ========== LOAD STATS ==========
function loadVendorStats() {
  setTimeout(() => {
    const activeOrdersEl = document.getElementById('activeOrders');
    const qualityScoreEl = document.getElementById('qualityScore');
    
    if (activeOrdersEl) activeOrdersEl.textContent = '3';
    if (qualityScoreEl) qualityScoreEl.textContent = '4.8';
  }, 500);
}

// ========== ORDER CONTROLS ==========
function setupOrderControls() {
  const increaseBtn = document.getElementById('increaseQty');
  const decreaseBtn = document.getElementById('decreaseQty');
  const qtyInput = document.getElementById('crateQuantity');
  const summaryQty = document.getElementById('summaryQty');
  
  if (!increaseBtn || !decreaseBtn || !qtyInput) return;
  
  // Update summary when quantity changes
  const updateSummary = () => {
    const qty = parseInt(qtyInput.value) || 1;
    if (summaryQty) summaryQty.textContent = qty;
    
    // Update total price (assuming ₦8,500 per crate)
    const totalPriceEl = document.getElementById('totalPrice');
    if (totalPriceEl) {
      const total = qty * 8500;
      totalPriceEl.textContent = `₦${total.toLocaleString()}`;
    }
  };
  
  increaseBtn.addEventListener('click', () => {
    const currentValue = parseInt(qtyInput.value) || 1;
    if (currentValue < 100) {
      qtyInput.value = currentValue + 1;
      updateSummary();
    }
  });
  
  decreaseBtn.addEventListener('click', () => {
    const currentValue = parseInt(qtyInput.value) || 1;
    if (currentValue > 1) {
      qtyInput.value = currentValue - 1;
      updateSummary();
    }
  });
  
  qtyInput.addEventListener('input', updateSummary);
  
  // Initial update
  updateSummary();
}

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
  // Place Order Button
  const placeOrderBtn = document.getElementById('placeOrderBtn');
  if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', handlePlaceOrder);
  }
  
  // Logout Button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  // Language Toggle (if exists)
  const langToggle = document.getElementById('langToggle');
  if (langToggle) {
    langToggle.addEventListener('click', toggleLanguage);
  }
}

// ========== PLACE ORDER ==========
function handlePlaceOrder() {
  const quantity = parseInt(document.getElementById('crateQuantity')?.value) || 1;
  const deliveryTime = document.getElementById('deliveryTime')?.value || 'morning';
  const notes = document.getElementById('orderNotes')?.value || '';
  
  // Show loading state
  const btn = document.getElementById('placeOrderBtn');
  if (btn) {
    const originalText = btn.textContent;
    btn.textContent = '⏳ Processing...';
    btn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
      showNotification(`✅ Order placed! ${quantity} crate${quantity > 1 ? 's' : ''} will be delivered during ${deliveryTime} slot`, 'success');
      
      // Reset form
      document.getElementById('crateQuantity').value = '1';
      if (document.getElementById('orderNotes')) {
        document.getElementById('orderNotes').value = '';
      }
      
      // Update stats
      const activeOrdersEl = document.getElementById('activeOrders');
      if (activeOrdersEl) {
        const current = parseInt(activeOrdersEl.textContent) || 0;
        activeOrdersEl.textContent = current + 1;
      }
      
      // Restore button
      btn.textContent = originalText;
      btn.disabled = false;
    }, 1500);
  }
}

// ========== LOGOUT ==========
function handleLogout() {
  localStorage.removeItem('qooa_vendor_session');
  showNotification('Logged out successfully', 'info');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1000);
}

// ========== LANGUAGE TOGGLE ==========
function toggleLanguage() {
  const currentLangEl = document.getElementById('currentLang');
  if (currentLangEl) {
    const isEnglish = currentLangEl.textContent === 'English';
    currentLangEl.textContent = isEnglish ? 'Hausa' : 'English';
    showNotification(`Language switched to ${isEnglish ? 'Hausa' : 'English'}`, 'info');
  }
}