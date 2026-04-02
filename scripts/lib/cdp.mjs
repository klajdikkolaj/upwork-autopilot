import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

export const pluginRoot = path.resolve(currentDir, '..', '..');
export const cdpUrl = process.env.UPWORK_AUTOPILOT_CDP_URL || 'http://127.0.0.1:9225';

export async function loadPlaywright() {
  const modulePath = path.join(pluginRoot, 'node_modules', 'playwright-core', 'index.js');
  try {
    const moduleUrl = pathToFileURL(modulePath).href;
    const mod = await import(moduleUrl);
    return mod.default ?? mod;
  } catch (error) {
    throw new Error(
      `Unable to load playwright-core from ${modulePath}. Run ${path.join(
        pluginRoot,
        'scripts',
        'bootstrap.sh',
      )} first.\n${error.message}`,
    );
  }
}

export async function connectUpworkPage() {
  const playwrightCore = await loadPlaywright();
  const { chromium } = playwrightCore;
  const browser = await chromium.connectOverCDP(cdpUrl);
  const context = browser.contexts()[0];

  if (!context) {
    throw new Error(
      `No Chromium context found at ${cdpUrl}. Launch the dedicated Chrome session first.`,
    );
  }

  const page =
    context.pages().find((candidate) => candidate.url().includes('upwork.com')) ??
    context.pages()[0] ??
    (await context.newPage());

  await page.bringToFront();

  return { browser, context, page };
}

export function buildSearchUrl(keywordOrUrl) {
  if (keywordOrUrl.startsWith('http://') || keywordOrUrl.startsWith('https://')) {
    return keywordOrUrl;
  }

  const query = encodeURIComponent(keywordOrUrl);
  return `https://www.upwork.com/nx/search/jobs/?contractor_tier=3&hourly_rate=35-&payment_verified=1&proposals=0-4&q=${query}&sort=relevance%2Bdesc&t=0`;
}

export function absoluteUpworkUrl(value) {
  if (!value) return value;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `https://www.upwork.com${value}`;
}
