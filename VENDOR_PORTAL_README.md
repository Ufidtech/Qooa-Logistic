# QOOA Vendor Portal - Complete System

## 🎯 Overview

The **QOOA Vendor Portal** is a mobile-first web application that empowers Nigerian market vendors (especially "Mama Put" food sellers) to order fresh tomatoes directly from farmers, track deliveries in real-time, and provide feedback on quality. The system is bilingual (English/Pidgin) and integrates with IoT sensors to guarantee freshness.

---

## ✨ Features Implemented

### 1. 🔐 Vendor Onboarding

- **Registration Form**: Collect vendor name, phone, market location, stall number
- **Business Types**: Mama Put, Retailer, Wholesaler, Restaurant, Caterer
- **Language Toggle**: Switch between English and Nigerian Pidgin
- **Market Clusters**: Pre-populated list of major Nigerian markets
- **Success Flow**: SMS confirmation with login details

**Files**:

- [vendor-onboarding.html](vendor-onboarding.html)
- [js/vendor-onboarding.js](js/vendor-onboarding.js)

---

### 2. 🛒 Ordering System

- **Live Price Display**: Current price per QOOA-certified crate (pulled from backend/Google Sheets)
- **Quick Order**: Simple quantity selector with delivery date/time
- **Order Summary**: Real-time calculation of total cost
- **Standing Orders**: Subscription feature for recurring weekly orders
- **Smart Validation**: Minimum delivery date is tomorrow

**Features**:

- Quantity selector with +/- buttons
- Delivery time slots: Morning (6-10AM), Midday (10AM-2PM), Afternoon (2-6PM)
- Auto-calculated pricing
- Subscription frequency: Every Monday-Saturday

**Files**:

- [vendor-portal.html](vendor-portal.html)
- [js/vendor-portal.js](js/vendor-portal.js)

---

### 3. 🚚 Real-Time Tracking

- **Order Status Pipeline**:
  1. ✅ Order Confirmed
  2. 🚛 In Transit from North (Kano/Jos)
  3. 🏢 Arrived at Lagos Hub
  4. 🛵 Out for Delivery
  5. 📦 Delivered

- **Visual Progress Bar**: Shows current stage with completed/pending indicators
- **Order Details Modal**: Full tracking history with timestamps
- **IoT Quality Data**: Display average temperature, freshness score, and quality guarantee
- **Active/Completed Filters**: Toggle between ongoing and past orders

**Visual Elements**:

- Color-coded status badges
- Timeline-style tracking history
- Temperature and gas level summaries
- Estimated arrival times

---

### 4. 💳 Payment Integration

- **Payment Methods**:
  - **Paystack**: Card, bank transfer, USSD
  - **Direct Bank Transfer**: Display QOOA bank details with order ID as reference
- **Payment Status**: Pending/Completed indicators
- **Digital Receipts**: Order ID, amount, date, payment method
- **Payment Links**: Generated Paystack checkout URLs

**Security**:

- Payment status verification
- Secure transaction references
- Webhook integration for automated confirmation

---

### 5. ⭐ Feedback & Quality Reporting

- **Star Rating**: 1-5 stars for order quality
- **Comments**: Optional text feedback
- **Damage Reporting**: Upload photo of damaged produce
- **Refund Flow**: Partial refund/credit for damaged goods
- **Quality Score**: Vendor's overall rating displayed in dashboard

**"Rot Tax" Tracker**:

- Correlates vendor feedback with IoT telemetry data
- Identifies problematic routes or trucks
- Builds quality history for pricing adjustments

---

### 6. 🌐 Language Toggle (English ↔ Pidgin)

- **All UI Text**: Fully translated
- **Form Labels**: Dynamic language switching
- **Persistent**: Language preference saved in localStorage
- **Cultural Relevance**: Pidgin translations use authentic Nigerian English

**Translation Examples**:

- "Current Price" → "Price Now Now"
- "Place Order" → "Send Order"
- "Welcome" → "Welcome" (same)
- "Quality Score" → "Quality Mark"

**Files**:

- [js/vendor-translations.js](js/vendor-translations.js)

---

## 📁 Project Structure

```
QOOA/
├── vendor-onboarding.html     # Vendor registration page
├── vendor-portal.html         # Main vendor dashboard
├── dashboard.html             # Admin control tower (existing)
├── index.html                 # B2B login (existing)
│
├── css/
│   ├── vendor-styles.css      # Vendor portal styles
│   └── styles.css             # Existing admin styles
│
├── js/
│   ├── vendor-onboarding.js   # Registration logic
│   ├── vendor-portal.js       # Main portal logic
│   ├── vendor-translations.js # English/Pidgin translations
│   ├── dashboard.js           # Existing admin dashboard
│   ├── data.js                # Mock data (existing)
│   └── utils.js               # Utilities (existing)
│
├── VENDOR_BACKEND_API.md      # Complete backend API spec
├── HARDWARE_PLACEMENT_GUIDE.md # IoT sensor placement guide
├── BACKEND_REQUIREMENTS.md    # Original backend brief
├── HARDWARE_REQUIREMENTS.md   # Hardware specs
├── WORKFLOW_AND_DEMO.md       # Demo script
├── DEMO_SCRIPT.md             # Presentation guide
└── Readme.md                  # Main project README
```

---

## 🚀 Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Edge, Safari)
- Internet connection (for real-time features)
- Backend API running (see [VENDOR_BACKEND_API.md](VENDOR_BACKEND_API.md))

### Installation

#### 1. Clone the repository:

```bash
git clone https://github.com/your-org/qooa.git
cd qooa
```

#### 2. Open the vendor portal:

```bash
# For testing, open directly in browser:
open vendor-onboarding.html
# or
start vendor-onboarding.html  # Windows
xdg-open vendor-onboarding.html  # Linux
```

#### 3. For development with live reload:

```bash
# Using Python
python -m http.server 8000

# Or using Node.js
npx http-server -p 8000

# Then open: http://localhost:8000/vendor-onboarding.html
```

---

## 🎨 User Flows

### Flow 1: New Vendor Registration

```
1. Visit vendor-onboarding.html
2. Toggle language (English/Pidgin) if needed
3. Fill registration form:
   - Vendor name
   - Phone number
   - Market location
   - Stall number
   - Business type
4. Accept terms & conditions
5. Submit
6. Success modal appears
7. Redirect to vendor-portal.html
```

### Flow 2: Place an Order

```
1. Log into vendor-portal.html
2. View current price in "Quick Order" section
3. Select quantity using +/- buttons
4. Choose delivery date and time
5. Review order summary
6. Click "Place Order"
7. Choose payment method:
   - Paystack (card/transfer)
   - Direct bank transfer
8. Complete payment
9. Order appears in "Active Orders" with tracking
```

### Flow 3: Track Order

```
1. View order in "My Orders" section
2. Click on order card to see details
3. View tracking stages:
   - Confirmed → In Transit → At Hub → Out for Delivery → Delivered
4. See IoT quality data:
   - Average temperature during transit
   - Freshness score
   - Quality guarantee badge
5. Receive SMS/WhatsApp updates (backend integration)
```

### Flow 4: Submit Feedback

```
1. Wait for order status = "Delivered"
2. "Rate This Order" button appears
3. Click to open feedback modal
4. Select 1-5 stars
5. Add optional comments
6. Upload photo of damage (if any)
7. Submit feedback
8. Refund processed if damage reported
```

### Flow 5: Setup Subscription

```
1. Go to "Standing Order" section
2. Click "Setup Subscription"
3. Enter:
   - Number of crates
   - Frequency (e.g., Every Tuesday)
   - Delivery time
4. Activate subscription
5. Automatic orders created every week
6. Can cancel anytime
```

---

## 🔌 Backend Integration

### API Endpoints Required

See [VENDOR_BACKEND_API.md](VENDOR_BACKEND_API.md) for complete specifications.

**Critical Endpoints**:

```
POST /api/vendors/register         # Vendor registration
POST /api/vendors/login            # Authentication (SMS OTP)
GET  /api/pricing/current          # Get current crate price
POST /api/orders/create            # Place new order
GET  /api/orders/vendor            # Get vendor's orders
GET  /api/tracking/:orderId        # Real-time tracking data
POST /api/payments/initiate        # Start Paystack payment
POST /api/feedback/submit          # Submit order feedback
POST /api/subscriptions/create    # Create subscription
```

### Data Storage

**LocalStorage Keys** (for demo/MVP):

```javascript
qooa_vendor_session        # Vendor login session
qooa_language              # en or pidgin
qooa_vendor_orders         # Order history
qooa_vendor_subscription   # Active subscription
qooa_current_price         # Cached price
```

---

## 🛠️ Technology Stack

### Frontend

- **HTML5**: Semantic markup
- **CSS3**: Custom styles with CSS variables
- **Vanilla JavaScript**: No frameworks (lightweight, fast)
- **LocalStorage**: Client-side caching
- **Responsive Design**: Mobile-first approach

### Backend (See [VENDOR_BACKEND_API.md](VENDOR_BACKEND_API.md))

- **Node.js + Express** OR **Python + Flask/FastAPI**
- **PostgreSQL**: Primary database
- **Redis**: Real-time caching
- **Socket.IO**: WebSocket for live updates
- **Paystack API**: Payment processing
- **SMS API**: Termii or Africa's Talking

### IoT Hardware (See [HARDWARE_PLACEMENT_GUIDE.md](HARDWARE_PLACEMENT_GUIDE.md))

- **ESP32**: Microcontroller
- **DHT22**: Temperature/humidity sensors
- **MQ-3**: Gas sensor (ethanol detection)
- **NEO-6M**: GPS module
- **SD Card**: Offline data logging
- **MQTT**: IoT data protocol

---

## 🌍 Deployment

### Frontend Deployment

#### Option 1: Netlify (Recommended for MVP)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

#### Option 2: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### Option 3: GitHub Pages

```bash
# Push to GitHub
git add .
git commit -m "Deploy vendor portal"
git push origin main

# Enable GitHub Pages in repo settings
```

### Backend Deployment

See [VENDOR_BACKEND_API.md](VENDOR_BACKEND_API.md) for:

- AWS EC2 setup
- Database configuration
- Environment variables
- SSL certificates

---

## 🧪 Testing

### Manual Testing Checklist

#### Registration Flow:

- [ ] All form fields validate correctly
- [ ] Phone number format validation
- [ ] Email optional field works
- [ ] "Other market" field appears when selected
- [ ] Language toggle updates all text
- [ ] Success modal displays after submission

#### Ordering Flow:

- [ ] Price displays correctly
- [ ] Quantity selector works (+/- buttons)
- [ ] Order summary calculates correctly
- [ ] Delivery date restricts past dates
- [ ] Payment modal opens on order submit
- [ ] Order appears in "Active Orders" after payment

#### Tracking Flow:

- [ ] Order status updates display correctly
- [ ] Progress bar reflects current stage
- [ ] Order details modal shows full info
- [ ] IoT data displays (if available)
- [ ] Color-coded status badges work

#### Feedback Flow:

- [ ] "Rate Order" button only shows for delivered orders
- [ ] Star rating selection works
- [ ] Photo upload accepts images
- [ ] Feedback submits successfully
- [ ] Quality score updates in dashboard

#### Subscription Flow:

- [ ] Subscription form validates inputs
- [ ] Subscription status displays correctly
- [ ] Cancel button works
- [ ] Recurring orders are created automatically (backend)

---

## 📱 Mobile Responsiveness

The vendor portal is fully responsive with breakpoints at:

- **Desktop**: > 1024px (full grid layout)
- **Tablet**: 768px - 1024px (2-column grid)
- **Mobile**: < 768px (single column, stacked)

### Mobile-Specific Features:

- Touch-friendly buttons (min 44x44px)
- Swipe-friendly modals
- Simplified navigation
- Large fonts for readability
- Bottom-aligned action buttons

---

## 🌟 Key Differentiators

### 1. **Language Inclusivity**

Most Nigerian tech products ignore Pidgin. QOOA embraces it for "Mama Put" vendors who are most comfortable with Pidgin English.

### 2. **IoT Trust Layer**

Vendors see real-time temperature data proving freshness—no other tomato supplier offers this transparency.

### 3. **Offline-First Architecture**

Sensors log data to SD cards during network dead zones, syncing when back online. Critical for Nigerian highways.

### 4. **Quality-Based Pricing**

Feedback + IoT data creates dynamic pricing. High-quality shipments command premium prices.

### 5. **WhatsApp-Style UX**

Familiar interface patterns reduce learning curve for non-technical users.

---

## 🚧 Roadmap

### Phase 1: MVP (Current)

- ✅ Vendor registration
- ✅ Order placement
- ✅ Real-time tracking UI
- ✅ Payment integration (frontend)
- ✅ Feedback system
- ✅ Language toggle

### Phase 2: Beta (Next 3 Months)

- [ ] Backend API implementation
- [ ] SMS notifications
- [ ] WhatsApp integration
- [ ] Paystack live integration
- [ ] IoT data streaming
- [ ] Admin broadcast tool

### Phase 3: Scale (Months 4-6)

- [ ] Predictive quality analytics
- [ ] Route optimization
- [ ] Multi-crop support (onions, peppers)
- [ ] Vendor credit system
- [ ] Mobile app (React Native)

### Phase 4: Expansion (Months 7-12)

- [ ] Pan-African expansion (Ghana, Kenya)
- [ ] Blockchain quality records
- [ ] Cold chain integration
- [ ] AI-powered demand forecasting

---

## 🐛 Known Issues & Limitations

### Current Limitations:

1. **Mock Data**: All data stored in localStorage (not persistent across devices)
2. **No Authentication**: Session management is simplified for demo
3. **Payment Simulation**: Paystack integration is frontend-only
4. **No Real-Time Updates**: WebSocket not implemented yet
5. **Limited Error Handling**: Network errors may not display friendly messages

### Future Improvements:

- Real backend API integration
- JWT authentication
- Progressive Web App (PWA) for offline support
- Push notifications
- Multi-language support (Yoruba, Igbo, Hausa)

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Setup:

```bash
# Fork the repository
git clone https://github.com/your-username/qooa.git
cd qooa

# Create a feature branch
git checkout -b feature/your-feature-name

# Make changes and test thoroughly

# Commit with clear messages
git commit -m "Add: vendor subscription cancellation flow"

# Push and create pull request
git push origin feature/your-feature-name
```

### Code Style:

- Use semantic HTML5
- Follow BEM naming for CSS classes
- Write vanilla JavaScript (ES6+)
- Add comments for complex logic
- Test on mobile devices

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 👥 Team

- **Product Lead**: [Your Name]
- **Frontend Developer**: [Your Name]
- **Backend Developer**: [TBD]
- **Hardware Engineer**: [TBD]
- **Design**: [Your Name]

---

## 📞 Support

- **Email**: support@qooa.com
- **WhatsApp**: +234-XXX-XXXX-XXX
- **Documentation**: https://docs.qooa.com
- **GitHub Issues**: https://github.com/your-org/qooa/issues

---

## 🙏 Acknowledgments

- Nigerian farmers and vendors who inspired this solution
- Mama Put sellers who tested the Pidgin translations
- Mile 12 Market Association for partnership
- ESP32 IoT community for hardware guidance

---

## 📚 Additional Documentation

- [VENDOR_BACKEND_API.md](VENDOR_BACKEND_API.md) - Complete backend API specification
- [HARDWARE_PLACEMENT_GUIDE.md](HARDWARE_PLACEMENT_GUIDE.md) - IoT sensor placement strategy
- [BACKEND_REQUIREMENTS.md](BACKEND_REQUIREMENTS.md) - Original backend development brief
- [WORKFLOW_AND_DEMO.md](WORKFLOW_AND_DEMO.md) - Demo presentation guide

---

## 🎯 Impact Metrics (Goals)

### Pre-QOOA:

- 45-50% post-harvest loss
- ₦72 Billion annual waste
- No quality visibility
- Unpredictable pricing

### Post-QOOA (Targets):

- **< 20% post-harvest loss** (55% reduction)
- **₦40B+ annual savings**
- **100% quality transparency**
- **Stable pricing** (± 10% variance)
- **5000+ vendors** onboarded (Year 1)
- **50,000+ crates tracked** (Year 1)

---

**Last Updated**: February 3, 2026  
**Version**: 1.0  
**Status**: MVP Complete, Backend Integration Pending

---

_Made with ❤️ for Nigerian Vendors_
