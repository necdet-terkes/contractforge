# Pact Broker Guide

## Accessing the Broker

### 1. Start the broker

```bash
npm run pact:broker:up
```

### 2. Open the web UI

- **URL**: http://localhost:9292
- **Username**: `pact`
- **Password**: `pact`

### 3. Check broker health

```bash
curl http://localhost:9292/health
# or in a browser
open http://localhost:9292
```

## What you can view in the broker

### Home

- **Pacts**: All published contracts
- **Verifications**: Provider verification results
- **Matrix**: Consumer–provider compatibility matrix

### Pacts page

- Contracts per consumer–provider pair
- Contract versions
- Last updated timestamps

### Verifications page

- Provider verification results
- Pass/fail status
- Verification timestamps

### Matrix page

- Compatibility between consumer and provider versions
- Which versions are compatible or incompatible

## Publishing test results to the broker

### Run and publish consumer tests

```bash
# Run consumer pact tests
npm run pact:consumer --workspace orchestrator-api

# Run consumer pact tests and publish
npm run pact:consumer:all --workspace orchestrator-api
```

### Run provider verifications

```bash
# Verify all providers
npm run pact:verify

# Verify a single provider
npm run pact:verify --workspace inventory-api
```

### Full workflow

```bash
# Start broker → consumer tests → publish → verify → stop broker
npm run pact:all
```

## Stop the broker

```bash
npm run pact:broker:down
```

## Data persistence

- Pact contracts and verification results are stored in Postgres
- Data lives in the `pact-broker-db-data` Docker volume
- Data persists across broker restarts

## API access

Example broker API calls:

```bash
# List pacts
curl -u pact:pact http://localhost:9292/pacts

# Specific pact
curl -u pact:pact http://localhost:9292/pacts/provider/inventory-api/consumer/orchestrator-api/latest
```
