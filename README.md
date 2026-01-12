# PayWhirl Shipping Update Tool

A minimal CLI tool to update `deliveryPrice` on PayWhirl subscriptions.

## Features
- Update a single subscription with confirmation.
- Batch update subscriptions via CSV.
- Comprehensive audit logging in `logs/audit.csv`.
- Rate-limit friendly (sequential processing).

## Setup
1. Ensure `PAYWHIRL_API_TOKEN` is set in your Replit Secrets.
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Single Update
Run the tool and follow the prompts:
```bash
npm start
```

### Batch Update
1. Create a CSV file at `data/updates.csv` with the following columns:
   `subscription_id,new_delivery_price`
2. Run the batch command:
   ```bash
   npm run batch
   ```
   *Note: Use `--yes` flag to skip individual confirmations.*

## Environment Variables
- `PAYWHIRL_API_TOKEN`: Your PayWhirl API token (Required).

## Logging
Every action is logged to `logs/audit.csv` with:
`timestamp,subscription_id,old_delivery_price,new_delivery_price,status,error`