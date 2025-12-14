# CI Refactoring Summary

## Overview

Refactored CI from a single monolithic workflow to a **multi-pipeline monorepo** architecture where each service has its own pipeline that runs based on path filters.

## Files Added/Changed

### Reusable Workflows (`.github/workflows/_*.yml`)

- `_node-ci.yml` - Common Node.js setup, typecheck, lint, unit tests, coverage
- `_pact-broker.yml` - Pact Broker lifecycle management (currently kept for reference, broker management is inline in service workflows)
- `_mockoon.yml` - Mockoon mock generation and management
- `_playwright.yml` - Playwright E2E test execution

### Service-Specific Workflows

- `inventory-ci.yml` - Inventory API pipeline
- `user-ci.yml` - User API pipeline
- `pricing-ci.yml` - Pricing API pipeline
- `orchestrator-ci.yml` - Orchestrator API pipeline
- `ui-ci.yml` - UI App pipeline
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
| **ui-ci**           | `ui-app/**`, shared configs                       | Typecheck, lint, Playwright (mock mode)                    |
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

## Benefits

1. **Faster CI**: Only relevant pipelines run based on changed paths
2. **Better isolation**: Each service has its own pipeline
3. **Easier debugging**: Service-specific failures are isolated
4. **Scalability**: Easy to add new services with their own pipelines
5. **Reusability**: Common workflows are shared via reusable workflows
