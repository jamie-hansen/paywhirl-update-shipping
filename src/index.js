import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { DateTime } from 'luxon';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { applyAuth, getSubscription, updateDeliveryPrice } from './client.js';

const argv = yargs(hideBin(process.argv))
  .option('batch', { type: 'string', description: 'Path to CSV file for batch processing' })
  .option('yes', { type: 'boolean', description: 'Skip confirmation', default: false })
  .argv;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (query) => new Promise((resolve) => rl.question(query, resolve));

async function logAudit(record) {
  const logDir = 'logs';
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
  const logFile = path.join(logDir, 'audit.csv');
  const headers = !fs.existsSync(logFile);
  
  const csvLine = stringify([record], { header: headers, columns: ['timestamp', 'subscription_id', 'old_delivery_price', 'new_delivery_price', 'status', 'error'] });
  fs.appendFileSync(logFile, csvLine);
}

async function processUpdate(subId, newPrice, skipConfirm) {
  const timestamp = DateTime.now().toISO();
  let oldPrice = 'N/A';
  
  try {
    console.log(`\n--- Processing Subscription: ${subId} ---`);
    const subData = await getSubscription(subId);
    const sub = subData.data || subData;
    oldPrice = sub.deliveryPrice;
    
    console.log(`Current deliveryPrice: ${oldPrice}`);
    console.log(`New deliveryPrice: ${newPrice}`);
    
    if (!skipConfirm) {
      const answer = await ask('Confirm update? (y/N): ');
      if (answer.toLowerCase() !== 'y') {
        console.log('Skipped.');
        await logAudit({ timestamp, subscription_id: subId, old_delivery_price: oldPrice, new_delivery_price: newPrice, status: 'skipped', error: '' });
        return { subId, status: 'skipped' };
      }
    }
    
    await updateDeliveryPrice(subId, newPrice);
    console.log('✅ Success: deliveryPrice updated.');
    await logAudit({ timestamp, subscription_id: subId, old_delivery_price: oldPrice, new_delivery_price: newPrice, status: 'success', error: '' });
    return { subId, status: 'success' };
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    await logAudit({ timestamp, subscription_id: subId, old_delivery_price: oldPrice, new_delivery_price: newPrice, status: 'error', error: error.message });
    return { subId, status: 'error', error: error.message };
  }
}

async function main() {
  applyAuth();
  
  const results = [];
  
  if (argv.batch) {
    const csvPath = argv.batch;
    if (!fs.existsSync(csvPath)) {
      console.error(`File not found: ${csvPath}`);
      process.exit(1);
    }
    
    const content = fs.readFileSync(csvPath);
    const records = parse(content, { columns: true, skip_empty_lines: true });
    
    console.log(`Starting batch process for ${records.length} subscriptions...`);
    
    let processedCount = 0;
    for (const record of records) {
      const res = await processUpdate(record.subscription_id, record.new_delivery_price, argv.yes);
      results.push(res);
      processedCount++;

      if (processedCount % 30 === 0 && processedCount < records.length) {
        console.log(`\nThrottle: pausing for 60s after 30 updates…`);
        await new Promise(resolve => setTimeout(resolve, 60000));
        console.log(`Resume: Continuing batch processing.`);
      }
    }
    
    console.log('\n--- Batch Summary ---');
    console.table(results.map(r => ({ ID: r.subId, Status: r.status, Error: r.error || '-' })));
    
  } else {
    const subId = await ask('Enter PayWhirl Subscription ID: ');
    const newPrice = await ask('Enter New deliveryPrice: ');
    if (subId && newPrice) {
      await processUpdate(subId, newPrice, argv.yes);
    } else {
      console.log('Input cancelled.');
    }
  }
  
  rl.close();
}

main().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});