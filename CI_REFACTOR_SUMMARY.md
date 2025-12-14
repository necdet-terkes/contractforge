# CI Refactoring Summary

## Overview

Refactored CI from a single monolithic workflow to a **multi-pipeline monorepo** architecture where each service has its own pipeline that runs based on path filters. Each pipeline operates independently with its own test reporting and artifact uploads.

## Files Added/Changed

### Reusable Workflows (`.github/workflows/_*.yml`)

- `_node-ci.yml` - Common Node.js setup, typecheck, lint, unit tests, coverage
- `_mockoon.yml` - Mockoon mock generation and management with smart contract change detection
- `_playwright.yml` - Playwright E2E test execution with mock validation

### Service-Specific Workflows

- `inventory-ci.yml` - Inventory API pipeline
- `user-ci.yml` - User API pipeline
- `pricing-ci.yml` - Pricing API pipeline
- `orchestrator-ci.yml` - Orchestrator API pipeline
- `ui-ci.yml` - UI App pipeline (with mock validation)
- `integration-ci.yml` - Full integration/system tests

### Archived

- `ci.yml.old` - Original monolithic CI workflow (archived for reference)

## Pipeline Triggers

| Pipeline            | Triggers On                                       | What It Runs                                               |
| ------------------- | ------------------------------------------------- | ---------------------------------------------------------- |
| **inventory-ci**    | `inventory-api/**`, shared configs                | Unit tests, Pact provider verification                     |
| **user-ci**         | `user-api/**`, shared configs                     | Unit tests, Pact provider verification                     |
| **pricing-ci**      | `pricing-api/**`, shared configs                  | Unit tests, Pact provider verification                     |
| **orchestrator-ci** | `orchestrator-api/**`, shared configs             | Unit tests, Pact consumer tests + publish                  |
| **ui-ci**           | `ui-app/**`, shared configs                       | Typecheck, lint, Playwright (mock mode, with validation)   |
| **integration-ci**  | Any service change, `tools/mockoon/**`, workflows | Full stack: all tests, Pact flow, mocks, E2E (mock + real) |

**Shared Configs** (trigger all pipelines):

- `package.json`, `package-lock.json`
- `tsconfig*.json`, `.eslintrc*`
- `jest.base.config.ts`
- `tools/**` (if used by service)

## PR Gating Recommendations

**Required checks** (for service changes):

- `inventory-ci` (if `inventory-api/**` changed)
- `user-ci` (if `user-api/**` changed)
- `pricing-ci` (if `pricing-api/**` changed)
- `orchestrator-ci` (if `orchestrator-api/**` changed)
- `ui-ci` (if `ui-app/**` changed)

**Required for all PRs**:

- `integration-ci` (runs full stack validation)

## Local Testing Commands

See README.md "Running Pipelines Locally" section for detailed commands.

## Key Features

### Smart Mock Management

- **Contract Change Detection**: `_mockoon.yml` automatically detects when Pact contracts change and regenerates mocks only when needed
- **Mock Validation**: UI CI validates mock files exist before running Playwright tests in mock mode
- **Port-based Process Cleanup**: Processes are stopped by port lookup (works across isolated job environments)

### Process Management

- **Cross-Job Process Cleanup**: Uses port-based process lookup (`lsof`/`ss`/`netstat`) instead of PID files for reliable cleanup across isolated job environments
- **Fallback Mechanisms**: Multiple fallback methods ensure process cleanup works on different systems

### Test Reporting

- **Independent Reporting**: Each pipeline reports its own test results independently
- **Artifact Uploads**: Coverage reports and Playwright results uploaded per pipeline
- **No Aggregated Reports**: Removed aggregated test reporting since pipelines run independently

## Benefits

1. **Faster CI**: Only relevant pipelines run based on changed paths
2. **Better isolation**: Each service has its own pipeline with independent reporting
3. **Easier debugging**: Service-specific failures are isolated
4. **Scalability**: Easy to add new services with their own pipelines
5. **Reusability**: Common workflows are shared via reusable workflows
6. **Reliability**: Smart mock validation and process cleanup prevent silent failures
