# ContractForge

A contract-driven microservices Proof of Concept (POC) demonstrating inventory management, user loyalty tiers, and dynamic pricing rules.

## 🎯 Overview

ContractForge is a microservices-based e-commerce system that showcases:

- **Inventory Management**: Product catalog with stock tracking
- **User Management**: Customer accounts with loyalty tier assignments (Bronze, Silver, Gold)
- **Dynamic Pricing**: Tier-based discount rules and real-time price calculations
- **Service Orchestration**: Coordinated requests across multiple microservices
- **Modern UI**: React-based admin panel and checkout preview interface

## 🏗️ Architecture

The system consists of four microservices and a React frontend:

```
┌─────────────┐
│   UI App    │ (React + Vite)
│  Port 5173  │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Orchestrator   │ (Port 4000)
│     Service     │
└───┬───┬───┬─────┘
    │   │   │
    ▼   ▼   ▼
┌─────┐ ┌─────┐ ┌────────┐
│Inv. │ │User │ │Pricing │
│4001 │ │4002 │ │ 4003   │
└─────┘ └─────┘ └────────┘
```

### Services

1. **Orchestrator API** (Port 4000)
   - Coordinates requests across all services
   - Provides catalog aggregation endpoints
   - Handles checkout preview orchestration

2. **Inventory API** (Port 4001)
   - Manages product catalog
   - Tracks stock levels
   - Handles base pricing

3. **User API** (Port 4002)
   - Manages user accounts
   - Assigns loyalty tiers (Bronze, Silver, Gold)

4. **Pricing API** (Port 4003)
   - Manages discount rules
   - Calculates dynamic pricing based on loyalty tiers
   - Provides pricing quotes

5. **UI App** (Port 5173)
   - React-based frontend
   - Admin panel for managing resources
   - Checkout preview interface
   - System overview dashboard

## 🛠️ Tech Stack

### Backend

- **Node.js** with **TypeScript**
- **Express.js** for REST APIs
- **Swagger/OpenAPI** for API documentation
- **Axios** for inter-service communication

### Frontend

- **React 18** with **TypeScript**
- **Vite** for build tooling
- Modern component-based architecture

### Development

- **npm workspaces** for monorepo management
- **TypeScript** for type safety
- **Concurrently** for running multiple services

## 📦 Prerequisites

- **Node.js** 18+ and npm
- **TypeScript** 5.6+
- (Optional) Docker for Pact Broker

## 🚀 Getting Started

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd contractforge
```

2. Install all dependencies:

```bash
npm run install:all
```

### Running the Application

#### Option 1: Run All Services (Recommended)

Run all services and the UI in development mode:

```bash
npm run dev:all
```

This will start:

- Orchestrator API on `http://localhost:4000`
- Inventory API on `http://localhost:4001`
- User API on `http://localhost:4002`
- Pricing API on `http://localhost:4003`
- UI App on `http://localhost:5173`

#### Option 2: Run Services Individually

Run each service separately:

```bash
# Orchestrator API
npm run dev:orchestrator

# Inventory API
npm run dev:inventory

# User API
npm run dev:user

# Pricing API
npm run dev:pricing

# UI App
npm run dev:ui
```

### Building for Production

Build all services:

```bash
npm run build
```

Start production servers:

```bash
npm run start:orchestrator
npm run start:inventory
npm run start:user
npm run start:pricing
```

## ✅ Testing

Standardized tooling is in place across the monorepo.

- **Root scripts**
  - `npm run test:unit` — runs all Jest tests across workspaces
  - `npm run test:ui` — runs Playwright tests (ui-app)
  - `npm run test:all` — runs unit + UI tests together
- `npm run check` — typecheck + lint + unit tests

- **Per-service Jest** (API services)
  - `npm test --workspace orchestrator-api`
  - `npm test --workspace inventory-api`
  - `npm test --workspace user-api`
  - `npm test --workspace pricing-api`

- **Playwright (UI)**
  - `npm test --workspace ui-app`
  - Config: `ui-app/playwright.config.ts`
  - Example: `ui-app/tests/example.spec.ts`

Notes:

- Jest base config lives at `jest.base.config.ts`.
- Services export their Express `app` for supertest; servers only listen when `NODE_ENV !== "test"`.

### Git hooks (Husky)

- **pre-commit**: lint-staged (eslint --fix + prettier write) then `npm run test:unit`
- **pre-push**: `npm run check` (typecheck + lint + unit tests)

### CI

- GitHub Actions workflow `.github/workflows/ci.yml`
- Runs on pull_request and push to main
- Steps: npm ci → typecheck → lint → unit tests → install Playwright chromium → UI tests → Pact Broker → consumer pacts → provider verification

### Contract Testing (Pact)

- **Pact Broker**: Local Docker setup with Postgres persistence
  - Start: `npm run pact:broker:up`
  - Stop: `npm run pact:broker:down`
  - Health check: `npm run pact:broker:health`
  - **Web UI**: http://localhost:9292 (username: `pact`, password: `pact`)
    - View published pacts, verifications, and compatibility matrix
    - See contract versions and verification results
    - Check consumer-provider compatibility
  - **Detailed Guide**: See `PACT_BROKER_GUIDE.md` for usage instructions

- **Consumer Tests** (orchestrator-api):
  - Run: `npm run pact:consumer --workspace orchestrator-api`
  - Publish: `npm run pact:publish --workspace orchestrator-api`
  - Tests: `orchestrator-api/src/__pact__/*.pact.test.ts`
  - Covers: GET /products/:id, GET /users/:id, GET /pricing/quote

- **Provider Verification**:
  - Run all: `npm run pact:verify`
  - Per service: `npm run pact:verify --workspace inventory-api` (or user-api, pricing-api)
  - Scripts: `{service}/scripts/pact-verify.ts`

- **Full Pact Flow**:

  ```bash
  npm run pact:all
  ```

  This runs: broker up → health check → consumer tests → publish → provider verification → broker down

- **Environment Variables**:
  - `PACT_BROKER_BASE_URL` (default: http://localhost:9292)
  - `PACT_BROKER_USERNAME` (default: pact)
  - `PACT_BROKER_PASSWORD` (default: pact)
  - `PACT_CONSUMER_VERSION` (default: local-dev, or GIT_COMMIT)
  - `PACT_CONSUMER_BRANCH` (default: local, or GIT_BRANCH)
  - `PACT_PROVIDER_VERSION` (default: local-dev, or GIT_COMMIT)
  - `PACT_PROVIDER_BRANCH` (default: local, or GIT_BRANCH)

## 📚 API Documentation

Each service provides Swagger documentation:

- **Orchestrator API**: http://localhost:4000/docs
- **Inventory API**: http://localhost:4001/docs
- **User API**: http://localhost:4002/docs
- **Pricing API**: http://localhost:4003/docs

The Admin panel also includes quick links to all API documentation.

## 🎨 UI Features

### Overview Dashboard

- System architecture overview
- Service status indicators
- Quick navigation to other sections

### Admin Panel

- **Users Management**: Create, update, delete users with loyalty tiers
- **Products Management**: Manage product catalog, stock, and pricing
- **Pricing Rules**: Configure discount rules for loyalty tiers
- **API Documentation Links**: Quick access to Swagger docs for all services

### Checkout Preview

- Browse product catalog
- Select users to preview loyalty discounts
- Real-time price calculations
- Visual discount indicators

## 📁 Project Structure

```
contractforge/
├── orchestrator-api/     # Orchestration service
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── utils/        # HTTP client utilities
│   │   └── *.ts          # Service clients
│   └── package.json
├── inventory-api/        # Inventory service
│   ├── src/
│   │   ├── routes/       # Product routes
│   │   ├── utils/        # Validation utilities
│   │   └── *.ts          # Product repository
│   └── package.json
├── user-api/             # User service
│   ├── src/
│   │   ├── routes/       # User routes
│   │   └── *.ts          # User repository
│   └── package.json
├── pricing-api/          # Pricing service
│   ├── src/
│   │   ├── routes/       # Pricing & rules routes
│   │   ├── utils/        # Validation utilities
│   │   └── *.ts          # Pricing logic
│   └── package.json
├── ui-app/               # React frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── hooks/        # Custom React hooks
│   │   └── *.tsx         # Main views
│   └── package.json
├── types/                # Shared TypeScript types
│   ├── loyaltyTier.ts
│   └── utils/            # Shared utilities
├── package.json          # Root package.json
└── tsconfig.base.json    # Base TypeScript config
```

## 🔧 Configuration

### Environment Variables

Services can be configured via environment variables:

**Orchestrator API:**

- `PORT` - Server port (default: 4000)
- `CORS_ORIGIN` - CORS allowed origin (default: http://localhost:5173)
- `INVENTORY_API_URL` - Inventory service URL (default: http://localhost:4001)
- `USER_API_URL` - User service URL (default: http://localhost:4002)
- `PRICING_API_URL` - Pricing service URL (default: http://localhost:4003)

**Other Services:**

- `PORT` - Server port (defaults: 4001, 4002, 4003)
- `CORS_ORIGIN` - CORS allowed origin (default: http://localhost:5173)

**UI App:**

- `VITE_ORCHESTRATOR_BASE_URL` - Orchestrator API URL
- `VITE_INVENTORY_API_URL` - Inventory API URL
- `VITE_USER_API_URL` - User API URL
- `VITE_PRICING_API_URL` - Pricing API URL

## 🧪 Testing

- **Run all unit tests (Jest across services + Playwright UI):**
  ```bash
  npm run test:unit
  ```
- **Per workspace unit tests (Jest):**
  ```bash
  npm test --workspace orchestrator-api
  npm test --workspace inventory-api
  npm test --workspace user-api
  npm test --workspace pricing-api
  ```
- **UI Playwright tests (installs chromium automatically):**
  ```bash
  npm test --workspace ui-app
  ```
- **Full check (typecheck + lint + unit):**
  ```bash
  npm run check
  ```

Test coverage focuses on pure logic and repositories:

- inventory-api: product repository CRUD + validation/error cases
- user-api: user repository CRUD + validation/error cases
- pricing-api: discount rule CRUD, rate validation, pricing calculation rules
- orchestrator-api: client helpers (path/query/error mapping) + checkout orchestration builder/error mapper

## 📝 Key Features

### Shared Utilities

- **Common Types**: Shared `LoyaltyTier` type across services
- **Error Handling**: Standardized error response utilities
- **Validation**: Shared validation functions for loyalty tiers

### Code Quality

- **TypeScript**: Full type safety across all services
- **Shared Code**: Common utilities in `types/` directory
- **Consistent Patterns**: Standardized HTTP client, error handling, and validation

### UI/UX

- **Design System**: Consistent spacing, colors, and typography
- **Reusable Components**: Card, Button, SectionHeader, etc.
- **Modern Layout**: Card-based sections, improved visual hierarchy
- **Responsive Design**: Works on different screen sizes

## 🔄 Development Workflow

1. Make changes to any service
2. Services auto-reload with `ts-node-dev` in dev mode
3. UI auto-reloads with Vite HMR
4. Check Swagger docs for API changes
5. Test in the UI

## 🐳 Docker (Optional)

Pact Broker can be run with Docker:

```bash
# Start Pact Broker
npm run pact:broker:up

# Stop Pact Broker
npm run pact:broker:down
```

## 📄 License

This is a POC project for demonstration purposes.

## 🤝 Contributing

This is a proof of concept project. For improvements or issues, please create an issue or pull request.

## 📞 Support

For questions or issues, please refer to the API documentation or check the Swagger UI for each service.

---

**Note**: This is a POC demonstrating microservices architecture, contract-driven development, and modern UI patterns. It uses in-memory data stores and is not intended for production use.
