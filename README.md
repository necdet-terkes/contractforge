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
  - `npm run test:unit` — runs all Jest tests (API services only)
  - `npm run test:coverage` — runs Jest tests with coverage report
  - `npm run test:e2e` — runs Playwright E2E tests (ui-app)
  - `npm run test:all` — runs unit + E2E tests together
- `npm run check` — typecheck + lint + unit tests

- **Per-service Jest** (API services)
  - `npm test --workspace orchestrator-api`
  - `npm test --workspace inventory-api`
  - `npm test --workspace user-api`
  - `npm test --workspace pricing-api`

- **Playwright E2E (UI)**
  - `npm run test:e2e` — runs all E2E tests (mock + real mode)
  - `npm run test:e2e --workspace ui-app` — runs from ui-app directory
  - Config: `ui-app/playwright.config.ts`
  - Tests: `ui-app/e2e/tests/*.spec.ts`
  - **Note**: When running tests locally with mocks, start mocks separately first:
    ```bash
    npm run mocks:dev  # Starts mocks in background
    npm run test:e2e
    ```
    In CI, mocks are automatically started before tests.

Notes:

- Jest base config lives at `jest.base.config.ts`.
- Services export their Express `app` for supertest; servers only listen when `NODE_ENV !== "test"`.

### Git hooks (Husky)

- **pre-commit**: lint-staged (eslint --fix + prettier write) then `npm run test:unit`
- **pre-push**: `npm run check` (typecheck + lint + unit tests)

### CI (Split Pipelines - Simulated Multi-Repo)

Each service/team has its own workflow with path filters (pull_request + push to main + manual), plus a system-level workflow:

- `ci-orchestrator.yml` – orchestrator-api unit + Pact consumer publish (broker service per job)
- `ci-inventory.yml` – inventory-api unit + provider verification (broker service per job)
- `ci-user.yml` – user-api unit + provider verification (broker service per job)
- `ci-pricing.yml` – pricing-api unit + provider verification (broker service per job)
- `ci-ui.yml` – ui-app typecheck/lint + Playwright mock-mode (pull pacts → generate mocks → start Mockoon)
- `ci-system.yml` – nightly/manual integration: start broker → consumer publish → provider verify → generate mocks → UI Playwright mock-mode (optional real-mode on schedule/flag)

**Path filters** (trigger each workflow when related paths change):
- Service folders (`inventory-api/**`, `user-api/**`, `pricing-api/**`, `orchestrator-api/**`, `ui-app/**`)
- Shared tooling/config (`tools/**`, `.github/**`, `package*.json`, `tsconfig*.json`, `.eslintrc*`)

**Reusable building blocks**:
- `_node-ci.yml` – typecheck, lint, unit/coverage for a workspace
- `_playwright.yml` / `_mockoon.yml` remain for reuse, but main flows are inline for clarity

#### Running Pipelines Locally

**Service-specific checks:**

```bash
# Inventory API
npm run typecheck --workspace inventory-api
npm run lint
npm run test --workspace inventory-api
npm run pact:verify --workspace inventory-api

# User API
npm run typecheck --workspace user-api
npm run lint
npm run test --workspace user-api
npm run pact:verify --workspace user-api

# Pricing API
npm run typecheck --workspace pricing-api
npm run lint
npm run test --workspace pricing-api
npm run pact:verify --workspace pricing-api

# Orchestrator API
npm run typecheck --workspace orchestrator-api
npm run lint
npm run test --workspace orchestrator-api
npm run pact:consumer:all --workspace orchestrator-api

# UI App
npm run typecheck --workspace ui-app
npm run lint
npm run test:e2e --workspace ui-app
```

**System workflow (ci-system.yml) locally (mock mode):**

```bash
# Start broker (compose mounts DB volume locally)
docker-compose up -d
# Publish consumer contracts and verify providers
npm run pact:consumer:all --workspace orchestrator-api
npm run pact:verify
# Generate mocks and run mock-mode UI tests
npm run pacts:pull
npm run mocks:generate
npm run mocks:start
MOCK_MODE=true VITE_MOCK_MODE=true npx playwright test --project=mock-mode
docker-compose down
```

#### Manual System Workflow Trigger

1. Go to Actions → CI - System (Mock + Optional Real)
2. Click "Run workflow"
3. (Optional) set `run_real_mode: true` to include real-mode admin CRUD

#### PR Gating

**Recommended branch protection rules:**

- `ci-orchestrator`
- `ci-inventory`
- `ci-user`
- `ci-pricing`
- `ci-ui`
- `ci-system` (optional, for main/nightly confidence)

**Setting up Branch Protection Rules:**

1. Go to **Settings** → **Branches**
2. Add/edit rule for `main`
3. Enable **Require status checks to pass before merging**
4. Add the checks above (only those relevant to changed paths need to be required)
5. Optionally enable:
   - **Require branches to be up to date before merging**
   - **Require conversation resolution before merging**

**Test Reporting**:

- Coverage reports (HTML + JSON) uploaded as artifacts per pipeline
- Playwright test results and traces uploaded as artifacts
- GitHub Actions provides native test result summaries for each pipeline
- JUnit XML reports from Playwright for CI integration
- Each pipeline reports its own test results independently

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
  - Covers all CRUD operations:
    - **inventory-api**: GET /products, GET /products/:id, POST /products, PUT /products/:id, DELETE /products/:id
    - **user-api**: GET /users, GET /users/:id, POST /users, PUT /users/:id, DELETE /users/:id
    - **pricing-api**: GET /pricing/rules, GET /pricing/rules/:id, POST /pricing/rules, PUT /pricing/rules/:id, DELETE /pricing/rules/:id, GET /pricing/quote

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

### Contract-Driven Mocking (Pact → Mockoon)

**This is the core value proposition of ContractForge**: Automatically generate mock APIs from Pact contracts, eliminating manual mock creation and ensuring mocks always match contracts.

#### Why This Matters

In real-world scenarios:

- Real environments often lack usable test data
- UI, integration, and system tests must rely on mocks
- Mocks must be contract-accurate
- **Contracts are the single source of truth**

When contracts change:

1. Pact tests fail
2. Contracts are updated
3. Mockoon mocks are regenerated automatically
4. Tests pass again **without manual mock editing**

#### How It Works

1. **Pact contracts** define expected interactions (consumer tests)
2. **Generator** (`tools/mockoon/generate.ts`) converts Pact interactions → Mockoon routes
3. **Mockoon CLI** serves mock APIs from generated environments
4. **Application** switches to mock URLs when `MOCK_MODE=true`

#### Local Mock Workflow

```bash
# 1. Pull pacts (from broker or local files)
npm run pacts:pull

# 2. Generate Mockoon environments from pacts
npm run mocks:generate

# 3. Start mock APIs
npm run mocks:start

# Or do all three in one command:
npm run mocks:dev
```

**Generated mocks run on fixed ports:**

- `inventory-api` mock: http://localhost:5001
- `user-api` mock: http://localhost:5002
- `pricing-api` mock: http://localhost:5003

#### Running the App in Mock Mode

```bash
# Start app entirely on mocks (recommended)
npm run dev:mock
# or
npm run dev:mock:all
```

Both commands do the same thing. They automatically:

1. **Pull pacts** (from broker or local files)
2. **Generate Mockoon environments** from pacts
3. **Start Mockoon mocks** (ports 5001-5003) in background
4. **Start orchestrator-api** with `MOCK_MODE=true` (points to mocks)
5. **Start UI app** with `VITE_MOCK_MODE=true`
6. **UI displays a banner**: 🧪 Mock Mode Enabled

**Note**: Real APIs (inventory-api, user-api, pricing-api) are NOT started. Only mocks + orchestrator + UI.

The mock generation happens automatically before starting services, so you don't need to run `pacts:pull` or `mocks:generate` separately.

#### Visual Indicator

When running in mock mode, the UI displays a prominent banner at the top of every page:

> 🧪 **Mock Mode Enabled** — APIs served from contract-generated mocks

This makes the POC self-explanatory in demos.

#### Pact Source Options

**Option 1: From Pact Broker (recommended)**

```bash
PACT_BROKER_BASE_URL=http://localhost:9292 \
PACT_BROKER_USERNAME=pact \
PACT_BROKER_PASSWORD=pact \
npm run pacts:pull
```

**Option 2: From Local Files (fallback)**

```bash
# Uses orchestrator-api/pacts/*.json
npm run pacts:pull
```

Set `PACT_SOURCE=broker` to force broker download.

#### What Happens When Contracts Change

1. **Developer updates consumer test** (e.g., adds new field)
2. **Pact test runs** → generates new pact file
3. **Pact is published to broker** (or saved locally)
4. **Run `npm run mocks:generate`** (or `npm run dev:mock:all` which auto-generates) → Mockoon environment updated
5. **Tests run against updated mocks** → pass/fail based on contract accuracy
6. **No manual mock editing required!**

**Automatic Mock Updates:**

- `dev:mock:all` automatically pulls pacts and generates mocks before starting
- Playwright tests (when run locally) automatically generate mocks before starting
- CI workflow generates mocks before running UI tests

#### CI Flow

The CI workflow automatically:

1. Runs Pact consumer tests
2. Publishes pacts to broker
3. Verifies provider contracts
4. **Generates Mockoon mocks from pacts**
5. **Starts mocks in background**
6. **Runs UI tests against mocks**

This ensures:

- Mocks are always contract-accurate
- Tests can run without real services
- Contract changes immediately affect mocks

#### File Structure

```
tools/mockoon/
├── pacts/              # Downloaded/copied pact files
├── generated/          # Generated Mockoon environments (gitignored)
├── pull-pacts.ts       # Script to pull pacts from broker or local
└── generate.ts         # Pact → Mockoon generator
```

**Note**: `generated/` is gitignored. Mocks are regenerated from pacts on-demand.

#### Environment Variables

- `MOCK_MODE` - Enable mock mode (orchestrator-api uses mock ports)
- `VITE_MOCK_MODE` - Enable mock mode in UI (shows banner)
- `PACT_BROKER_BASE_URL` - Pact Broker URL for pulling pacts
- `PACT_BROKER_USERNAME` - Broker authentication
- `PACT_BROKER_PASSWORD` - Broker authentication
- `PACT_SOURCE` - `broker` to force broker download, otherwise uses local files

### Playwright E2E Testing

ContractForge includes comprehensive end-to-end tests using Playwright that run against contract-generated mocks. This ensures UI tests validate real user journeys while remaining deterministic and CI-friendly.

#### Test Structure

Tests are organized using the **Page Object Model (POM)** pattern:

```
ui-app/e2e/
├── pages/              # Page Object Models
│   ├── BasePage.ts
│   ├── Header.ts
│   ├── CheckoutPage.ts
│   ├── AdminPage.ts
│   ├── AdminUsersSection.ts
│   ├── AdminProductsSection.ts
│   └── AdminPricingRulesSection.ts
├── tests/              # Test specifications
│   ├── smoke.spec.ts          # App loads, mock mode visible
│   ├── checkout.spec.ts       # Checkout flow tests
│   ├── admin.spec.ts          # Admin CRUD operations
│   └── e2e-pricing.spec.ts    # End-to-end pricing rules
├── fixtures/           # Test data fixtures
│   └── testData.ts
└── utils/              # Custom assertions
    └── assertions.ts
```

#### Running E2E Tests Locally

**Prerequisites:**

1. Start mocks and UI in mock mode:

   ```bash
   npm run mocks:dev
   # In another terminal:
   npm run dev:mock:all
   ```

2. Or let Playwright start the UI automatically (mocks must be running separately):
   ```bash
   npm run mocks:dev
   # Then in another terminal:
   npm run test:e2e
   ```

**Available Commands:**

```bash
# Run all E2E tests (mock mode + real mode)
npm run test:e2e

# Run only mock mode tests (smoke, checkout, e2e-pricing)
cd ui-app
npx playwright test --project=mock-mode

# Run only real mode tests (admin CRUD - requires real APIs)
# First start real APIs: npm run dev:all
cd ui-app
npx playwright test --project=real-mode

# Run with Playwright UI (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed
```

**Running Real Mode Tests Locally:**

```bash
# 1. Start real APIs
npm run dev:all

# 2. In another terminal, run real mode tests
cd ui-app
MOCK_MODE=false VITE_MOCK_MODE=false npx playwright test --project=real-mode
```

**Note**:

- Mock mode tests: Mocks must be running (`npm run mocks:dev`)
- Real mode tests: Real APIs must be running (`npm run dev:all`)
- Playwright will start the UI app and orchestrator automatically

#### Test Coverage

**1. Smoke Tests** (`smoke.spec.ts`)

- App loads and displays correctly
- Mock mode banner is visible when in mock mode
- Navigation tabs are present and clickable

**2. Checkout Flow** (`checkout.spec.ts`)

- Catalog renders products with base prices
- Products show stock status correctly
- Base prices shown when no user selected
- Selecting a user updates pricing with discounts
- Selected user info is displayed
- Clearing user selection resets to base prices

**3. Admin CRUD** (`admin.spec.ts`) - **Runs in REAL mode**

- **Users**: Create, update, delete operations using form-based inline edit UI
- **Products**: Create, update, delete operations using form-based inline edit UI
- **Pricing Rules**: Create, update, delete operations using form-based inline edit UI
- All operations use unique IDs per test run
- Tests clean up created entities automatically
- **Admin → Checkout Integration Tests**: Verifies that CRUD operations in admin panel reflect in checkout page:
  - Created users/products/rules appear in checkout
  - Updated users/products/rules reflect in checkout
  - Deleted users/products/rules disappear from checkout
- **Note**: These tests require real APIs (not mocks) because Mockoon is static and doesn't persist state changes

**4. End-to-End Pricing** (`e2e-pricing.spec.ts`)

- Creating a pricing rule affects checkout discounts
- Updating a pricing rule rate changes checkout discounts
- Verifies full flow from admin to checkout

**5. Admin CRUD Effects on Checkout** (`admin.spec.ts` - Integration tests)

- User CRUD: Created/updated/deleted users appear/disappear in checkout user selection
- Product CRUD: Created/updated/deleted products appear/disappear in checkout catalog
- Pricing Rule CRUD: Created/updated/deleted rules affect discount calculations in checkout
- Tests verify end-to-end data flow from admin operations to checkout display

#### CI Integration

E2E tests run automatically in CI in two phases:

**Phase 1: Mock Mode Tests** (smoke, checkout, e2e-pricing)

1. **Mocks are generated** from Pact contracts
2. **Mocks are started** in background
3. **Playwright browsers are installed**
4. **Mock mode tests run** against mocks
5. **Mocks are stopped**

**Phase 2: Real Mode Tests** (admin CRUD)

1. **Real APIs are started** (inventory-api, user-api, pricing-api)
2. **Real mode tests run** against real APIs
3. **Real APIs are stopped**

The CI workflow ensures:

- Mock mode tests run with `MOCK_MODE=true` (UI shows mock banner)
- Real mode tests run with `MOCK_MODE=false` (no mock banner)
- All tests are deterministic and isolated
- Test results and traces are available for debugging
- Each pipeline reports its own test results independently

#### Troubleshooting

**Tests fail with "connection refused" or "ECONNREFUSED":**

- Ensure mocks are running: `npm run mocks:dev`
- Check mock ports: 5001 (inventory), 5002 (user), 5003 (pricing)
- Verify UI is accessible at http://localhost:5173

**Mock mode banner not visible:**

- Ensure `VITE_MOCK_MODE=true` is set
- Check browser console for errors
- Verify mocks are responding: `curl http://localhost:5001/products`

**Tests timeout:**

- Increase timeout in `playwright.config.ts` if needed
- Check network tab for slow API calls
- Verify mocks are responding quickly

**Admin edit operations:**

- Admin uses form-based inline edit UI (no dialogs)
- Click "Edit" button to enter edit mode, modify fields inline, then click "Save" or "Cancel"
- Page objects handle form interactions directly
- If tests fail on updates, check form field selectors and save/cancel button interactions

#### Test Data

Tests use unique IDs per run (timestamp + random) to avoid conflicts:

- User IDs: `u-e2e-{timestamp}-{random}`
- Product IDs: `p-e2e-{timestamp}-{random}`
- Rule IDs: `rule-e2e-{timestamp}-{random}`

All created entities are cleaned up after each test.

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
  - **Inline Edit UI**: Click "Edit" to modify user fields directly in the table row
  - Form-based editing with Save/Cancel buttons
- **Products Management**: Manage product catalog, stock, and pricing
  - **Inline Edit UI**: Click "Edit" to modify product fields directly in the table row
  - Form-based editing with Save/Cancel buttons
- **Pricing Rules**: Configure discount rules for loyalty tiers
  - **Inline Edit UI**: Click "Edit" to modify rule fields directly in the table row
  - Form-based editing with Save/Cancel buttons
- **API Documentation Links**: Quick access to Swagger docs for all services
- **Real-time Integration**: Changes in admin panel immediately reflect in checkout preview

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
- **Run tests with coverage:**
  ```bash
  npm run test:coverage
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

- **Unit Tests (Jest)**: Repository CRUD operations, validation, and error handling
  - inventory-api: product repository CRUD + validation/error cases
  - user-api: user repository CRUD + validation/error cases
  - pricing-api: discount rule CRUD, rate validation, pricing calculation rules
  - orchestrator-api: client helpers (path/query/error mapping) + checkout orchestration builder/error mapper
- **Contract Tests (Pact)**: Consumer-driven contracts for all API interactions (GET, POST, PUT, DELETE)
- **E2E Tests (Playwright)**: UI tests run against Mockoon mocks generated from Pact contracts
- **Mock System**: All UI and integration tests use contract-generated mocks, ensuring tests always match contracts

### Test Reporting

ContractForge includes comprehensive test reporting that aggregates results from all test frameworks:

- **Jest Coverage**: Coverage reports in HTML, JSON, LCOV, and JSON-summary formats
- **Playwright Reports**: HTML reports and JUnit XML for CI integration
- **Combined Summary**: Single report showing:
  - Total test counts (Jest + Playwright)
  - Pass/fail/skip statistics
  - Coverage metrics (lines, statements, functions, branches)
  - Pass rate calculation

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
npm run pact-broker:up

# Stop Pact Broker
npm run pact-broker:down
```

## 📄 License

This is a POC project for demonstration purposes.

## 🤝 Contributing

This is a proof of concept project. For improvements or issues, please create an issue or pull request.

## 📞 Support

For questions or issues, please refer to the API documentation or check the Swagger UI for each service.

---

**Note**: This is a POC demonstrating microservices architecture, contract-driven development, and modern UI patterns. It uses in-memory data stores and is not intended for production use.
