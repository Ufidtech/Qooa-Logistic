// QOOA Vendor Onboarding - Registration Logic

document.addEventListener("DOMContentLoaded", function () {
  setupOnboardingForm();
  setupMarketSelection();
});

function setupOnboardingForm() {
  const form = document.getElementById("registrationForm");

  if (form) {
    form.addEventListener("submit", handleRegistration);
  }
}

function setupMarketSelection() {
  const marketSelect = document.getElementById("marketCluster");
  const otherMarketGroup = document.getElementById("otherMarketGroup");

  if (marketSelect && otherMarketGroup) {
    marketSelect.addEventListener("change", function () {
      if (this.value === "other") {
        otherMarketGroup.style.display = "block";
        document.getElementById("otherMarket").required = true;
      } else {
        otherMarketGroup.style.display = "none";
        document.getElementById("otherMarket").required = false;
      }
    });
  }
}

async function handleRegistration(e) {
  e.preventDefault();

  const formData = {
    vendorName: document.getElementById("vendorName").value,
    phoneNumber: document.getElementById("phoneNumber").value,
    email: document.getElementById("email").value || null,
    marketCluster: document.getElementById("marketCluster").value,
    otherMarket: document.getElementById("otherMarket")?.value || null,
    stallNumber: document.getElementById("stallNumber").value,
    businessType: document.getElementById("businessType").value,
    orderSize: document.getElementById("orderSize").value,
    registeredAt: new Date().toISOString(),
    language: currentLang,
  };

  try {
    // In production, this would be an API call
    const response = await registerVendor(formData);

    if (response.success) {
      // Store session
      localStorage.setItem(
        "qooa_vendor_session",
        JSON.stringify({
          vendorId: response.vendorId,
          vendorName: formData.vendorName,
          marketCluster: formData.marketCluster,
          stallNumber: formData.stallNumber,
          phoneNumber: formData.phoneNumber,
        }),
      );

      // Show success modal
      showSuccessModal();
    }
  } catch (error) {
    console.error("Registration error:", error);
    alert("Registration failed. Please try again.");
  }
}

// Simulated API call (replace with actual backend endpoint)
async function registerVendor(data) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Generate vendor ID
  const vendorId = "VEN" + Date.now().toString().slice(-8);

  // Store in localStorage for demo (replace with actual backend)
  const vendors = JSON.parse(localStorage.getItem("qooa_vendors") || "[]");
  vendors.push({
    ...data,
    vendorId,
    status: "active",
    qualityScore: 5.0,
    totalOrders: 0,
  });
  localStorage.setItem("qooa_vendors", JSON.stringify(vendors));

  return {
    success: true,
    vendorId,
    message: "Registration successful",
  };
}

function showSuccessModal() {
  const modal = document.getElementById("successModal");
  if (modal) {
    modal.style.display = "flex";

    const goToLoginBtn = document.getElementById("goToLoginBtn");
    if (goToLoginBtn) {
      goToLoginBtn.addEventListener("click", function () {
        window.location.href = "vendor-portal.html";
      });
    }
  }
}

// Modal close functionality
document.querySelectorAll(".modal-close").forEach((btn) => {
  btn.addEventListener("click", function () {
    this.closest(".modal").style.display = "none";
  });
});

window.addEventListener("click", function (e) {
  if (e.target.classList.contains("modal")) {
    e.target.style.display = "none";
  }
});
