# CI Architecture - Pact-First Architecture

## Overview

This CI architecture uses a **pact-first approach** where contract verification and mock generation must succeed before service-specific tests can run. This ensures contracts are always valid and mocks are available for all tests.

## Architecture Principles

### 1. Pact Flow as Prerequisite

**`pact-flow.yml`** is the prerequisite workflow that must succeed before any service-specific CI can run:

1. **Consumer tests** (orchestrator) → Publish contracts to broker
2. **Provider verification** (all providers) → Verify against broker contracts
3. **Mock generation** → Generate Mockoon mocks from verified contracts
4. **Upload artifacts** → Mocks available for all other CI pipelines

**If pact-flow fails:**

- All service-specific CI pipelines are skipped
- Merge to `main` is blocked
- This ensures contracts are always valid before any other tests run

### 2. Service-Specific CI Pipelines

After `pact-flow` succeeds, service-specific CI pipelines run in parallel:

- **orchestrator-ci.yml**: Unit tests
- **inventory-ci.yml**: Unit tests
- **user-ci.yml**: Unit tests
- **pricing-ci.yml**: Unit tests
- **ui-ci.yml**: Unit tests + Playwright tests (uses mocks from pact-flow)

### 3. Dependency Flow

**POC (Monorepo):**

```
pact-flow.yml (Prerequisite)
  ↓ (Consumer tests → Broker → Provider verification → Mock generation)
  ↓ (Upload mocks as artifacts)
  ↓
Service CI Pipelines (Run in parallel after pact-flow succeeds)
  ├─ orchestrator-ci.yml → Unit tests
  ├─ inventory-ci.yml → Unit tests
  ├─ user-ci.yml → Unit tests
  ├─ pricing-ci.yml → Unit tests
  └─ ui-ci.yml → Unit tests + Playwright (uses mocks from pact-flow)
```

**Real-World Equivalent:**

In a real-world scenario, this would be:

- **Persistent shared broker** (runs 24/7, accessible by all teams)
- **Persistent shared mock server** (runs 24/7, generated from broker contracts)
- Each team's CI connects to shared broker/mock server
- Contract verification happens before any other tests

## CI Pipeline Details

### Pact Flow (`pact-flow.yml`)

**Purpose**: Contract verification and mock generation (prerequisite for all other CI)

**Flow**:

1. Start broker (service container)
2. Consumer tests (orchestrator) → Publish contracts to broker
3. Provider verification (all providers) → Verify against broker contracts
4. Pull contracts from broker
5. Generate Mockoon mocks from contracts
6. Upload mocks as artifacts (for other CI pipelines)

**Success Criteria**:

- Consumer tests pass
- All provider verifications pass
- Mocks generated successfully
- Artifacts uploaded

**Failure Impact**:

- All service-specific CI pipelines are skipped
- Merge to `main` is blocked

### Orchestrator CI (`orchestrator-ci.yml`)

**Purpose**: Unit tests for orchestrator-api

**Flow**:

1. Wait for `pact-flow` to succeed
2. Run unit tests (typecheck, lint, unit tests, coverage)

**Dependencies**: `pact-flow`

### Provider CI (`inventory-ci.yml`, `user-ci.yml`, `pricing-ci.yml`)

**Purpose**: Unit tests for provider services

**Flow**:

1. Wait for `pact-flow` to succeed
2. Run unit tests (typecheck, lint, unit tests, coverage)

**Dependencies**: `pact-flow`

**Note**: Provider verification happens in `pact-flow`, not in individual provider CI pipelines.

### UI CI (`ui-ci.yml`)

**Purpose**: Unit tests + Playwright tests with mocks

**Flow**:

1. Wait for `pact-flow` to succeed
2. Download mocks from `pact-flow` artifacts
3. Run unit tests (typecheck, lint)
4. Start mock servers
5. Run Playwright tests (mock mode)
6. Stop mock servers

**Dependencies**: `pact-flow` (for mocks)

## Key Scenarios

### Scenario 1: Provider Changes Implementation

1. **Provider team** (e.g., inventory-api) changes code
2. **pact-flow** runs:
   - Consumer tests pass
   - **Provider verification fails** (doesn't match consumer contracts)
3. **Result**: `pact-flow` fails → All service CI pipelines skipped → Merge blocked

### Scenario 2: Consumer Changes Expectations

1. **Consumer team** (orchestrator) changes API expectations
2. **pact-flow** runs:
   - Consumer tests pass
   - New contracts published to broker
   - **Provider verification fails** (providers don't match new contracts)
3. **Result**: `pact-flow` fails → All service CI pipelines skipped → Merge blocked → Teams must update implementations

### Scenario 3: UI Tests Need Latest Mocks

1. **UI team** runs UI CI
2. **UI CI**:
   - Waits for `pact-flow` to succeed
   - Downloads mocks from `pact-flow` artifacts
   - Runs Playwright tests
3. **Result**: UI tests use contract-accurate mocks automatically

## Benefits

1. **Contract-First**: Contracts are verified before any other tests run
2. **Mock Availability**: Mocks are always available (generated from verified contracts)
3. **Early Detection**: Contract mismatches detected before merge
4. **Independent Teams**: Each service CI runs independently (after pact-flow)
5. **Real-World Simulation**: Mimics actual microservices architecture
6. **Breaking Change Prevention**: Verification gates prevent incompatible changes

## Current Implementation vs Real-World

### Current Implementation (POC)

**How it works:**

- **pact-flow**: Broker (service container) → Consumer tests → Provider verification → Mock generation → Upload artifacts
- **Service CI'lar**: Wait for `pact-flow` → Run unit tests (parallel)
- **UI CI**: Wait for `pact-flow` → Download mocks → Run Playwright tests

**Key Features:**

- **Pact-First**: Contract verification happens first
- **Artifact Sharing**: Mocks shared via artifacts (simulates shared mock server)
- **Service Containers**: Broker runs as service container (persistent within job)
- **Job Isolation**: Each CI job has its own broker instance, but mocks are shared via artifacts

**Why this works for POC:**

- Contract verification happens first (ensures contracts are valid)
- Mocks are generated from verified contracts (ensures mocks are accurate)
- Service CI'lar run after pact-flow (ensures mocks are available)
- UI CI uses mocks from pact-flow (ensures tests use contract-accurate mocks)

### Real-World Scenario

**How it would work:**

- **Persistent shared broker** (runs 24/7 on separate infrastructure, accessible by all teams)
- **Persistent shared mock server** (runs 24/7, generated from broker contracts)
- Orchestrator team: Publishes contracts to shared broker
- Provider teams: Connect to shared broker, verify against latest contracts
- UI team: Connects to shared mock server (generated from broker contracts)

**Key Difference:**

- In real-world: Broker and mocks are shared across all teams (single persistent instances)
- In POC: Broker per job (service container), but mocks shared via artifacts (simulates shared infrastructure)

## Notes

- **Pact-First**: Contract verification happens first, before any other tests
- **Artifact Sharing**: Mocks shared via artifacts (simulates shared mock server)
- **Service Containers**: Broker runs as service container (Postgres + Pact Broker) - persistent within job execution
- **Job Isolation**: Each CI job has its own broker instance, but mocks are shared via artifacts
- **Dependency Management**: Service CI'lar depend on `pact-flow` (ensures contracts are verified and mocks are available)

## Broker & Mock Architecture

### Pact Flow Approach

**How it works:**

1. **pact-flow**:
   - Broker başlatılır (service container)
   - Consumer tests + publish contracts to broker
   - Provider verification
   - Mock generation from broker contracts
   - **Mock'ları artifact olarak upload eder**

2. **Service CI'lar**:
   - `pact-flow`'un başarılı olmasını bekler
   - Unit tests çalıştırır

3. **UI CI**:
   - `pact-flow`'un başarılı olmasını bekler
   - Mock artifact'larını download eder
   - Mock'ları kullanır

### Service Container Approach

GitHub Actions service containers provide:

- **Persistent within job**: Broker stays alive for entire job execution
- **Health checks**: Postgres health check ensures database is ready
- **Automatic cleanup**: Service containers are automatically stopped after job completion
- **Isolation**: Each job has its own broker instance, but mocks are shared via artifacts

### Real-World vs POC

| Aspect                   | Real-World                         | POC (Current)                                 |
| ------------------------ | ---------------------------------- | --------------------------------------------- |
| **Broker Location**      | Separate infrastructure (24/7)     | Service container (per job)                   |
| **Mock Server Location** | Separate infrastructure (24/7)     | Generated per job, shared via artifacts       |
| **Persistence**          | Permanent (data survives restarts) | Within job (data cleared after job)           |
| **Sharing**              | Shared across all teams            | Mocks shared via artifacts                    |
| **Simulation**           | N/A                                | Simulates shared infrastructure via artifacts |
