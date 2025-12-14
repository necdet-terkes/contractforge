# CI Architecture - Real-World Scenario

## Overview

This CI architecture simulates a **real-world microservices environment** where:

- Each service runs in its own CI pipeline (independent repos/teams)
- Services communicate via contracts (Pact)
- Mock data is generated from contracts (contract-driven)
- Dependencies are managed through a persistent Pact Broker

## Architecture Principles

### 1. Independent Service CI Pipelines

Each service has its own CI that runs independently:

- **Orchestrator CI**: Consumer tests + publish contracts
- **Provider CI'lar** (inventory, user, pricing): Verify against broker contracts
- **UI CI**: Generate mocks from broker, run Playwright tests
- **Integration CI**: Full end-to-end validation

### 2. Pact Broker as Single Source of Truth

- **Persistent**: In real-world, broker runs 24/7, shared across teams
- **Consumer-Driven**: Orchestrator publishes contracts → Providers verify
- **Contract Changes**: When contracts change, verification fails → prevents breaking changes

### 3. Dependency Flow

**Real-World:**

```
Orchestrator CI
  ↓ (publishes contracts)
Pact Broker (persistent, shared)
  ↓ (providers verify)
Provider CI'lar (inventory, user, pricing)
  ↓ (if verification passes, merge allowed)
Pact Broker (updated contracts)
  ↓ (mock generation pulls contracts)
Mock Server (persistent, shared)
  ↓ (mocks available)
UI CI (Playwright tests with mocks)
```

**POC (Monorepo):**

```
Integration CI
  ↓ (consumer publish → verify → mock generate)
  ↓ (upload contracts + mocks as artifacts)
Artifacts (contracts + mocks)
  ↓ (download artifacts)
Provider CI'lar (inventory, user, pricing)
  ↓ (publish contracts to own broker → verify)
UI CI
  ↓ (download mocks → use for tests)
```

## CI Pipeline Details

### Orchestrator CI (`orchestrator-ci.yml`)

**Purpose**: Consumer publishes contracts to broker

**Flow**:

1. Unit tests
2. Consumer Pact tests
3. Publish contracts to broker (service container)
4. Upload contracts as artifact (for other CI pipelines)
5. **Success = Contracts available for providers to verify**

**Real-world**: Orchestrator team changes API expectations → publishes new contracts → Providers must update or verification fails

**POC**: Contracts published to broker + uploaded as artifact (simulates shared broker)

### Provider CI (`inventory-ci.yml`, `user-ci.yml`, `pricing-ci.yml`)

**Purpose**: Verify provider implementation matches consumer contracts

**Flow**:

1. Unit tests
2. Download contracts from Integration CI (artifact)
3. Start broker (service container)
4. Publish contracts to broker (simulates contracts in shared broker)
5. **Verify provider against contracts from broker**
6. **Success = Provider matches consumer expectations**

**Real-world**: Provider team changes implementation → Must verify against latest consumer contracts from shared broker → If verification fails, merge blocked

**POC Behavior**:

- Downloads contracts from Integration CI artifact (simulates shared broker)
- Publishes contracts to own broker (simulates contracts in shared broker)
- Verifies against broker (contracts from Integration CI)

### UI CI (`ui-ci.yml`)

**Purpose**: Use mocks from Integration CI and run UI tests

**Flow**:

1. Unit tests (typecheck, lint)
2. Download mocks from Integration CI (artifact)
3. If mocks not available: Download contracts from Integration CI, generate mocks
4. Start mock servers
5. Run Playwright tests (mock mode - checkout page)
6. **Success = UI works with latest contract-based mocks**

**Real-world**: UI team depends on mocks → Mocks in shared mock server (generated from broker contracts) → If contracts change, mocks regenerate automatically

**POC Behavior**:

- Downloads mocks from Integration CI artifact (simulates shared mock server)
- If mocks not available, downloads contracts and generates mocks
- Uses mocks for Playwright tests

### Integration CI (`integration-ci.yml`)

**Purpose**: Full end-to-end validation + generate shared contracts/mocks

**Flow**:

1. All unit tests
2. Consumer tests + publish to broker
3. Provider verification
4. Generate mocks from broker contracts
5. **Upload contracts as artifact** (for other CI pipelines)
6. **Upload mocks as artifact** (for UI CI)
7. E2E tests (mock mode + real mode)
8. **Success = Full system works together + artifacts available for other CI pipelines**

**Real-world**: Integration validation before release

**POC**: Full flow + artifact upload (simulates shared broker/mock server)

## Key Scenarios

### Scenario 1: Provider Changes Implementation

1. **Provider team** (e.g., inventory-api) changes code
2. **Provider CI** runs:
   - Unit tests pass
   - **Pact verification fails** (doesn't match consumer contracts)
3. **Result**: Merge blocked → Team must fix implementation or update contracts with consumer

### Scenario 2: Consumer Changes Expectations

**In Real-World:**

1. **Consumer team** (orchestrator) changes API expectations
2. **Orchestrator CI** runs:
   - Consumer tests pass
   - **New contracts published to shared persistent broker**
3. **Provider CI'lar** run (independently, later):
   - Connect to shared broker
   - **Pact verification fails** (providers don't match new contracts)
4. **Result**: Provider teams must update implementations → All verifications pass → Merge allowed

**In POC (Monorepo):**

1. **Consumer team** (orchestrator) changes API expectations
2. **Orchestrator CI** runs:
   - Consumer tests pass
   - **New contracts published to isolated broker** (only visible in orchestrator CI)
3. **Provider CI'lar** run (independently):
   - Start their own isolated broker (empty or with local pacts)
   - **Integration CI** runs full flow: consumer publish → provider verify → detects mismatch
4. **Result**: Integration CI fails → Teams coordinate → All verifications pass → Merge allowed

### Scenario 3: UI Tests Need Latest Mocks

**In Real-World:**

1. **UI team** runs UI CI
2. **UI CI**:
   - Connects to shared mock server (generated from broker contracts)
   - Runs Playwright tests
3. **Result**: UI tests use contract-accurate mocks automatically

**In POC (Monorepo):**

1. **UI team** runs UI CI
2. **UI CI**:
   - Downloads mocks from Integration CI artifact (simulates shared mock server)
   - If mocks not available, downloads contracts and generates mocks
   - Runs Playwright tests
3. **Result**: UI tests use contract-accurate mocks (from Integration CI or generated)

## Benefits

1. **Early Detection**: Contract mismatches detected before merge
2. **Independent Teams**: Each service CI runs independently
3. **Contract-Driven**: Mocks always match contracts (single source of truth)
4. **Real-World Simulation**: Mimics actual microservices architecture
5. **Breaking Change Prevention**: Verification gates prevent incompatible changes

## Current Implementation vs Real-World

### Current Implementation (Monorepo Simulation)

**How it works:**

- **Integration CI**: Full flow (broker + consumer publish + verify + mock generate)
  - Contract'ları artifact olarak upload eder
  - Mock'ları artifact olarak upload eder
- **Orchestrator CI**: Consumer tests + publish to broker + upload contracts as artifact
- **Provider CI'lar**:
  - Integration CI'dan contract artifact'larını download eder
  - Contract'ları kendi broker'ına publish eder (simulates shared broker)
  - Broker'dan verify eder
- **UI CI**:
  - Integration CI'dan mock artifact'larını download eder
  - Eğer yoksa, contract artifact'larını download edip mock generate eder
  - Mock'ları kullanır

**Key Features:**

- **Artifact Sharing**: Contract'lar ve mock'lar Integration CI'dan artifact olarak paylaşılır
- **Service Containers**: Broker runs as service container (persistent within job)
- **Job Isolation**: Each CI job has its own broker instance, but contracts/mocks are shared via artifacts
- **Fallback Logic**: Provider/UI CI'lar local pacts kullanabilir (Integration CI çalışmamışsa)

**Why this works for POC:**

- Integration CI full flow'u çalıştırır (gerçek hayat senaryosunu simüle eder)
- Contract'lar ve mock'lar artifact olarak paylaşılır (simulates shared broker/mock server)
- Her team'in CI'ı bağımsız çalışır ama ortak contract/mock'ları kullanır
- Provider verification works (contract'ları Integration CI'dan alıp broker'a yükler, verify eder)

### Real-World Scenario

**How it would work:**

- **Persistent shared broker** (runs 24/7 on separate infrastructure, accessible by all teams)
- **Persistent shared mock server** (runs 24/7, generated from broker contracts)
- Orchestrator team: Publishes contracts to shared broker
- Provider teams: Connect to shared broker, verify against latest contracts
- UI team: Connects to shared mock server (generated from broker contracts)

**Key Difference:**

- In real-world: Broker and mocks are shared across all teams (single persistent instances)
- In POC: Broker per job (service container), but contracts/mocks shared via artifacts (simulates shared infrastructure)

## Notes

- **Artifact Sharing**: Contract'lar ve mock'lar Integration CI'dan artifact olarak paylaşılır (simulates shared broker/mock server)
- **Service Containers**: Broker runs as service container (Postgres + Pact Broker) - persistent within job execution
- **Job Isolation**: Each CI job has its own broker instance, but contracts/mocks are shared via artifacts
- **Fallback Logic**: Provider/UI CI'lar local pacts kullanabilir (Integration CI çalışmamışsa)
- **Integration CI**: Runs full flow (consumer publish → verify → mock generate), uploads artifacts
- **Mock Regeneration**: Mocks regenerate automatically when contracts change (detected via timestamps)

## Broker & Mock Architecture

### Artifact-Based Sharing

**How it works:**

1. **Integration CI**:
   - Broker başlatılır (service container)
   - Consumer tests + publish contracts to broker
   - Provider verification
   - Mock generation from broker contracts
   - **Contract'ları artifact olarak upload eder**
   - **Mock'ları artifact olarak upload eder**

2. **Service-Specific CI'lar**:
   - Integration CI'dan contract artifact'larını download eder
   - Contract'ları kendi broker'ına publish eder (simulates shared broker)
   - Broker'dan verify eder

3. **UI CI**:
   - Integration CI'dan mock artifact'larını download eder
   - Eğer yoksa, contract artifact'larını download edip mock generate eder
   - Mock'ları kullanır

### Service Container Approach

GitHub Actions service containers provide:

- **Persistent within job**: Broker stays alive for entire job execution
- **Health checks**: Postgres health check ensures database is ready
- **Automatic cleanup**: Service containers are automatically stopped after job completion
- **Isolation**: Each job has its own broker instance, but contracts/mocks are shared via artifacts

### Real-World vs POC

| Aspect                   | Real-World                         | POC (Current)                                 |
| ------------------------ | ---------------------------------- | --------------------------------------------- |
| **Broker Location**      | Separate infrastructure (24/7)     | Service container (per job)                   |
| **Mock Server Location** | Separate infrastructure (24/7)     | Generated per job, shared via artifacts       |
| **Persistence**          | Permanent (data survives restarts) | Within job (data cleared after job)           |
| **Sharing**              | Shared across all teams            | Contracts/mocks shared via artifacts          |
| **Simulation**           | N/A                                | Simulates shared infrastructure via artifacts |
