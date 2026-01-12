# PayWhirl Shipping Update Tool

## Overview

A minimal CLI tool for managing PayWhirl subscription delivery prices. The tool provides two modes of operation: single subscription updates with interactive confirmation, and batch updates via CSV file processing. All operations are logged to an audit trail for accountability.

**Primary Purpose:** Automate the process of updating `deliveryPrice` values on PayWhirl subscriptions through their API.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Application Type
Node.js CLI application using ES modules (`"type": "module"` in package.json).

### Core Components

**Entry Point (`src/index.js`)**
- Handles CLI argument parsing using `yargs`
- Implements interactive prompts via Node's `readline` module
- Manages CSV parsing for batch operations
- Coordinates audit logging

**API Client (`src/client.js`)**
- Axios-based HTTP client configured for PayWhirl API (v2022-04)
- Authentication via `X-Api-Token` header from environment variable
- Exposes `getSubscription()` and `updateDeliveryPrice()` functions

### Data Flow
1. User provides subscription ID and new price (interactively or via CSV)
2. Tool fetches current subscription data from PayWhirl API
3. Displays current vs new price, requests confirmation (unless `--yes` flag)
4. Updates subscription via PUT request
5. Logs result to `logs/audit.csv`

### File Structure
```
├── src/
│   ├── index.js      # CLI entry point and orchestration
│   └── client.js     # PayWhirl API client wrapper
├── data/
│   └── updates.csv   # Input file for batch processing
├── logs/
│   └── audit.csv     # Audit trail output
```

### Design Decisions

**Sequential Processing for Batch Operations**
- Chosen to respect PayWhirl API rate limits
- Trade-off: Slower processing for large batches, but avoids API throttling

**CSV for Audit Logging**
- Uses `csv-stringify` for consistent formatting
- Appends to single file with automatic header creation
- Fields: timestamp, subscription_id, old/new prices, status, error

**Interactive Confirmation by Default**
- Prevents accidental updates
- Can be bypassed with `--yes` flag for scripted usage

## External Dependencies

### Third-Party Services

**PayWhirl API**
- Base URL: `https://api.shop.paywhirl.com/2022-04`
- Authentication: API token via `X-Api-Token` header
- Endpoints used:
  - `GET /subscriptions/{id}` - Fetch subscription details
  - `PUT /subscriptions/{id}` - Update subscription (deliveryPrice)

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PAYWHIRL_API_TOKEN` | Yes | PayWhirl API authentication token |

### NPM Dependencies

- `axios` - HTTP client for API requests
- `yargs` - CLI argument parsing
- `csv-parse` / `csv-stringify` - CSV file handling
- `luxon` - Timestamp formatting for audit logs