# CI Architecture - Split Pipelines (Simulated Multi-Repo)

## Overview

Each service/team has its own workflow with path filters, plus a system-level workflow. Every workflow starts its own Pact Broker via `docker-compose` (isolated per runner). Mocks are generated where needed (UI/system) and shared as artifacts inside the workflow. Brokers/mocks live only for the job (no cross-job persistence), which is the closest we can get to separate repos/teams inside a monorepo.

## Workflows

- **ci-orchestrator.yml**: Unit + Pact consumer publish (orchestrator-api) → upload pact artifacts
- **ci-inventory.yml**: Unit + provider verification (inventory-api)
- **ci-user.yml**: Unit + provider verification (user-api)
- **ci-pricing.yml**: Unit + provider verification (pricing-api)
- **ci-ui.yml**: Typecheck/lint + Playwright mock-mode (pull pacts → generate mocks → start Mockoon)
- **ci-system.yml**: Nightly/manual integration (mock-mode) and optional real-mode admin CRUD

**Reusable blocks**
- `_node-ci.yml` – typecheck, lint, unit/coverage for a single workspace
- `_mockoon.yml` / `_playwright.yml` remain available for reuse if needed

## Path Filters

Each workflow triggers on `pull_request` and `push` to `main` with paths scoped to its service plus shared config:
- Service dirs: `inventory-api/**`, `user-api/**`, `pricing-api/**`, `orchestrator-api/**`, `ui-app/**`
- Shared: `tools/**`, `.github/**`, `package*.json`, `tsconfig*.json`, `.eslintrc*`

## Per-Workflow Flow

### Orchestrator (ci-orchestrator)
1. Checkout + install
2. Start Pact Broker (`docker-compose up -d`) and wait
3. Unit/coverage (reusable `_node-ci.yml`)
4. Pact consumer tests + publish to broker
5. Upload pact artifacts
6. Stop broker (`docker-compose down`)

### Providers (ci-inventory / ci-user / ci-pricing)
1. Checkout + install
2. Start Pact Broker (`docker-compose up -d`) and wait
3. Unit/coverage (reusable `_node-ci.yml`)
4. Provider Pact verification against broker
5. Upload coverage
6. Stop broker (`docker-compose down`)

### UI (ci-ui)
1. Checkout + install
2. Start Pact Broker (`docker-compose up -d`) and wait
3. Pull pacts (broker, fallback to local) → generate mocks
4. Start Mockoon (ports 5001/5002/5003) and wait
5. Playwright mock-mode
6. Upload Playwright report
7. Stop mocks + broker

### System (ci-system)
- Triggers: nightly schedule, workflow_dispatch (with optional `run_real_mode`), and push to `main` for UI/API changes
- Flow:
  1. Start broker (`docker-compose up -d`) and wait
  2. Orchestrator consumer publish
  3. Provider verification (all)
  4. Pull pacts → generate mocks
  5. Start Mockoon, run Playwright mock-mode, upload report, stop mocks
  6. Optional real-mode (schedule or flag): start real APIs, run Playwright real-mode, stop APIs

## Trade-offs vs Real Multi-Repo

- **No shared long-lived broker**: Each job starts its own broker; contracts are not persisted across workflows. Artifacts are uploaded for observability but not consumed cross-workflow.
- **Mock sharing**: Mocks are generated inside the workflow and used locally; not shared across workflows.
- **Path filters**: Simulate per-repo triggers; shared changes trigger all relevant workflows.
- **Ports**: Each job uses its own runner, so port clashes are not an issue; mocks use 5001/5002/5003.

## Local Commands

- Start broker locally: `npm run pact:broker:up` (stop: `npm run pact:broker:down`)
- Consumer publish: `npm run pact:consumer:all --workspace orchestrator-api`
- Provider verify: `npm run pact:verify --workspace inventory-api` (or user/pricing)
- Generate mocks: `npm run pacts:pull && npm run mocks:generate`
- Start mocks locally: `npm run mocks:start`
- Playwright mock-mode locally: `MOCK_MODE=true VITE_MOCK_MODE=true npx playwright test --project=mock-mode`
