# QOOA Backend - Quick Start Guide

## Prerequisites

- Node.js 14+ installed
- npm or yarn package manager

## Installation

1. **Navigate to backend directory:**

```bash
cd backend
```

2. **Install dependencies:**

```bash
npm install
```

3. **Setup environment variables:**

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start the server:**

```bash
# Development mode (auto-restart on changes)
npm run dev

# Production mode
npm start
```

## Testing the API

### Health Check

```bash
curl http://localhost:3000/health
```

### Register a Vendor

```bash
curl -X POST http://localhost:3000/api/vendors/register \
  -H "Content-Type: application/json" \
  -d '{
    "vendorName": "Mama Chinedu Foods",
    "phoneNumber": "+2348081234567",
    "email": "mama@example.com",
    "marketCluster": "mile12",
    "stallNumber": "Shop 45",
    "businessType": "mama-put",
    "orderSize": "3-5",
    "language": "en"
  }'
```

### Get Current Price

```bash
curl http://localhost:3000/api/pricing/current
```

### Create Order (requires vendor authentication)

```bash
curl -X POST http://localhost:3000/api/orders/create \
  -H "Content-Type: application/json" \
  -H "x-vendor-id: VEN12345678" \
  -d '{
    "crateQuantity": 5,
    "deliveryDate": "2026-02-05",
    "deliveryTime": "morning"
  }'
```

## API Endpoints

See [VENDOR_BACKEND_API.md](../VENDOR_BACKEND_API.md) for complete documentation.

### Quick Reference:

- `POST /api/vendors/register` - Register vendor
- `GET /api/vendors/profile` - Get vendor profile
- `GET /api/pricing/current` - Get current price
- `POST /api/orders/create` - Create order
- `GET /api/orders/vendor` - Get vendor orders
- `POST /api/subscriptions/create` - Create subscription
- `POST /api/feedback/submit` - Submit feedback
- `POST /api/admin/broadcast` - Send broadcast

## Authentication

Currently using simple header-based authentication:

```javascript
headers: {
  'x-vendor-id': 'VEN12345678'
}
```

In production, implement JWT tokens.

## Next Steps

1. **Add PostgreSQL database** (see schema in VENDOR_BACKEND_API.md)
2. **Implement JWT authentication**
3. **Integrate Paystack webhooks**
4. **Add SMS notifications**
5. **Setup WebSocket for real-time updates**
6. **Connect IoT telemetry stream**

## Troubleshooting

### Port already in use:

```bash
# Change PORT in .env file
PORT=3001
```

### Dependencies not installing:

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## Support

For help, see:

- [VENDOR_BACKEND_API.md](../VENDOR_BACKEND_API.md)
- Email: dev@qooa.com
