import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFile = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(currentFile);
const pluginRoot = path.resolve(scriptDir, '..');
const configDir = path.join(pluginRoot, 'config');

const localPath = path.join(configDir, 'search-profile.local.json');
const templatePath = path.join(configDir, 'search-profile.template.json');
const localConfig = await loadJson(localPath);
const templateConfig = await loadJson(templatePath);
const configured = localConfig || templateConfig;

if (!configured) {
  throw new Error('No search profile configuration found.');
}

const filters = configured.filters || {};
const urls = (configured.keywords || []).map((keyword) => ({
  keyword,
  url: buildUrl(keyword, filters),
}));

console.log(
  JSON.stringify(
    {
      source: localConfig ? localPath : templatePath,
      filters,
      thresholds: configured.thresholds || {},
      skipRules: configured.skipRules || {},
      urls,
    },
    null,
    2,
  ),
);

async function loadJson(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function buildUrl(keyword, filters) {
  const params = new URLSearchParams({
    contractor_tier: String(filters.contractorTier ?? 3),
    hourly_rate: `${filters.hourlyRateMin ?? 35}-`,
    payment_verified: filters.paymentVerified === false ? '0' : '1',
    proposals: `0-${filters.proposalsMax ?? 4}`,
    q: keyword,
    sort: 'relevance+desc',
    t: '0',
  });

  return `https://www.upwork.com/nx/search/jobs/?${params.toString()}`;
}
