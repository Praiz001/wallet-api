# Wallet Service API

A backend wallet service with Paystack integration, JWT authentication, and API key management. Users can deposit funds, transfer money between wallets, and manage their transaction history.

**Live API Documentation:** https://wallet-api-prod.up.railway.app/docs

## Features

- Google OAuth authentication with JWT tokens
- Wallet deposits via Paystack
- Wallet-to-wallet transfers
- Transaction history
- API key system for service-to-service access
- Permission-based access control

## Tech Stack

- NestJS
- PostgreSQL with TypeORM
- Passport (Google OAuth + JWT)
- Paystack Payment API
- Swagger/OpenAPI documentation

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Google OAuth credentials
- Paystack account

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=wallet_db

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Paystack
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public

# Application
SERVER_PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
BASE_URL=http://localhost:3000
```

### Running the Application

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000` and Swagger docs at `http://localhost:3000/docs`.

## API Endpoints

### Authentication

- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - OAuth callback (returns JWT)

### API Keys

- `POST /keys/create` - Create API key
- `POST /keys/rollover` - Rollover expired API key

### Wallet Operations

- `POST /wallet/deposit` - Initialize deposit
- `POST /wallet/transfer` - Transfer funds
- `GET /wallet/balance` - Get balance
- `GET /wallet/transactions` - Get transaction history
- `GET /wallet/deposit/:reference/status` - Check deposit status

### Webhooks

- `POST /wallet/paystack/webhook` - Paystack webhook endpoint

## Authentication

The API supports two authentication methods:

1. **JWT Token**: Use `Authorization: Bearer <token>` header
2. **API Key**: Use `x-api-key: <key>` header

Both methods can be used interchangeably. API keys require specific permissions (`deposit`, `transfer`, `read`).

## Amount Format

All amounts are handled in **Kobo** (1 Naira = 100 Kobo).

Example: ₦5000 = 500000 kobo

## Testing

For Paystack testing, use the test card:

- Card: `4084084084084081`
- CVV: `408`
- Expiry: Any future date
- PIN: `0000`
- OTP: `123456`

## License

Private project.
