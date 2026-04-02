import fs from 'node:fs/promises';

import { connectUpworkPage } from './lib/cdp.mjs';
import { appendJsonl } from './lib/logging.mjs';

const proposalUrl = process.argv[2];
const payloadPath = process.argv[3];
const explicitLogPath = process.argv[4];

if (!proposalUrl || !payloadPath) {
  throw new Error(
    'Usage: node scripts/upwork-submit-proposal.mjs <proposal-url> <payload.json> [log.jsonl]',
  );
}

const payload = JSON.parse(await fs.readFile(payloadPath, 'utf8'));
const textareas = payload.textareas || [];
const inputs = payload.inputs || [];
const logPath = explicitLogPath || process.env.UPWORK_AUTOPILOT_LOG || null;

const { browser, page } = await connectUpworkPage();

await page.goto(proposalUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(3000);

if (textareas.length > 0) {
  await page.waitForFunction(
    (count) => document.querySelectorAll('textarea').length >= count,
    textareas.length,
    { timeout: 30000 },
  );
}

if (inputs.length > 0) {
  await page.waitForFunction(
    () =>
      Array.from(document.querySelectorAll('input')).some((el) => {
        const type = el.getAttribute('type');
        return !el.disabled && ['text', 'url', 'email', 'number', null].includes(type);
      }),
    { timeout: 30000 },
  );
}

const editableInputs = page.locator(
  'input:not([type="hidden"]):not([type="search"]):not([type="file"]):not([type="radio"]):not([type="checkbox"])',
);

for (let i = 0; i < inputs.length; i += 1) {
  const locator = editableInputs.nth(i);
  await locator.click({ timeout: 10000 });
  await locator.fill(inputs[i], { timeout: 20000 });
  await page.waitForTimeout(250);
}

for (let i = 0; i < textareas.length; i += 1) {
  const locator = page.locator('textarea').nth(i);
  await locator.click({ timeout: 10000 });
  await locator.fill(textareas[i], { timeout: 20000 });
  await page.waitForTimeout(250);
}

const beforeUrl = page.url();
await page.getByRole('button', { name: /submit a proposal/i }).click({ timeout: 20000 });
await page.waitForTimeout(3000);
await page.waitForURL((url) => /\?success\b/.test(url.toString()), { timeout: 60000 }).catch(() => {});

const result = await page.evaluate(() => ({
  url: location.href,
  title: document.title,
  bodyStart: (document.body?.innerText || '').slice(0, 4000),
}));

const proposalIdMatch = result.url.match(/\/proposals\/(\d+)\?success\b/);
const logEntry = {
  timestamp: new Date().toISOString(),
  payloadPath,
  beforeUrl,
  ...result,
  proposalId: proposalIdMatch ? proposalIdMatch[1] : null,
  success: /\?success\b/.test(result.url),
};

await appendJsonl(logPath, logEntry);

console.log(JSON.stringify(logEntry, null, 2));
await browser.close();
