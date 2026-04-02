import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';

const currentFile = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(currentFile);
const pluginRoot = path.resolve(scriptDir, '..');

const args = process.argv.slice(2);

function getFlagValue(flag) {
  const index = args.indexOf(flag);
  if (index === -1) return null;
  return args[index + 1] ?? null;
}

const force = args.includes('--force');
const configDir = path.resolve(getFlagValue('--config-dir') || path.join(pluginRoot, 'config'));
const profilePath = path.join(configDir, 'applicant-profile.local.md');
const searchProfilePath = path.join(configDir, 'search-profile.local.json');
const searchTemplatePath = path.join(configDir, 'search-profile.template.json');

if (!input.isTTY || !output.isTTY) {
  console.error('This setup wizard must run in an interactive terminal.');
  process.exit(1);
}

await main().catch((error) => {
  if (error?.name === 'AbortError' || error?.code === 'ABORT_ERR') {
    console.error('\nSetup cancelled.');
    process.exit(130);
  }

  console.error(error?.message || String(error));
  process.exit(1);
});

async function main() {
  const existingProfile = await loadMarkdownBullets(profilePath);
  const existingSearchProfile = await loadJson(searchProfilePath);
  const searchTemplate = (await loadJson(searchTemplatePath)) || defaultSearchProfile();
  const rl = readline.createInterface({ input, output });

  try {
  if ((existingProfile || existingSearchProfile) && !force) {
    const overwrite = await confirm(
      rl,
      'Existing local Upwork profile data was found. Overwrite it',
      false,
    );
    if (!overwrite) {
      console.log('Aborted without changing local profile files.');
      process.exit(0);
    }
  }

  const profile = {
    name: await ask(rl, 'Name', existingProfile?.Name, true),
    positioning: await ask(rl, 'Positioning or headline', existingProfile?.Positioning, true),
    years: await ask(
      rl,
      'Years of experience',
      existingProfile?.['Years of experience'],
      true,
      validateYears,
    ),
    locationTimezone: await ask(
      rl,
      'Location and timezone',
      existingProfile?.['Location and timezone'],
      true,
    ),
    frontend: await ask(rl, 'Frontend stack', existingProfile?.Frontend, true),
    backend: await ask(rl, 'Backend stack', existingProfile?.Backend, true),
    database: await ask(rl, 'Database stack', existingProfile?.Database, true),
    cloudDevops: await ask(
      rl,
      'Cloud and DevOps stack',
      existingProfile?.['Cloud and DevOps'],
      true,
    ),
    modelsApis: await ask(
      rl,
      'Models and APIs',
      existingProfile?.['Models and APIs'],
      true,
    ),
    orchestration: await ask(
      rl,
      'Agent frameworks and orchestration',
      existingProfile?.['Agent frameworks and orchestration'],
      true,
    ),
    automationPlatforms: await ask(
      rl,
      'Automation platforms',
      existingProfile?.['Automation platforms'],
      true,
    ),
    productionProof: await ask(
      rl,
      'Production proof points',
      existingProfile?.['Production proof points'],
      true,
    ),
    currentProject1: await ask(rl, 'Current work project 1', existingProfile?.['Project 1'], true),
    currentProject2: await ask(rl, 'Current work project 2', existingProfile?.['Project 2'], false),
    flagshipProject: await ask(
      rl,
      'Personal or flagship project',
      existingProfile?.Project,
      false,
    ),
    flagshipWhy: await ask(
      rl,
      'Why that flagship project proves fit',
      existingProfile?.['Why it proves fit'],
      false,
    ),
    hourlyMinimum: await ask(
      rl,
      'Hourly minimum (example: $40/hr)',
      existingProfile?.['Hourly minimum'],
      true,
      validateMoneyLike,
    ),
    fixedPriceMinimum: await ask(
      rl,
      'Fixed-price minimum (example: $5000)',
      existingProfile?.['Fixed-price minimum'],
      true,
      validateMoneyLike,
    ),
    hardNoGoPatterns: await ask(
      rl,
      'Hard no-go patterns',
      existingProfile?.['Hard no-go patterns'],
      true,
    ),
    preferredTone: await ask(
      rl,
      'Preferred proposal tone',
      existingProfile?.['Preferred tone'] || 'friendly and professional',
      true,
    ),
    requiredOpening: await ask(
      rl,
      'Required opening',
      existingProfile?.['Required opening'] || 'Hi,',
      true,
    ),
    topicsToEmphasize: await ask(
      rl,
      'Topics to emphasize',
      existingProfile?.['Topics to emphasize'],
      true,
    ),
    topicsToAvoid: await ask(
      rl,
      'Topics to avoid',
      existingProfile?.['Topics to avoid'],
      false,
    ),
    otherNotes: await ask(
      rl,
      'Other proposal notes',
      existingProfile?.['Other notes'],
      false,
    ),
  };

  const searchKeywordsDefault = (
    existingSearchProfile?.keywords ||
    searchTemplate.keywords ||
    []
  ).join(' | ');
  const searchKeywordsInput = await ask(
    rl,
    'Search keywords separated with |',
    searchKeywordsDefault,
    true,
    validateKeywordList,
  );
  const searchHourlyRateMin = await ask(
    rl,
    'Search minimum hourly rate filter',
    String(existingSearchProfile?.filters?.hourlyRateMin ?? searchTemplate.filters.hourlyRateMin ?? 35),
    true,
    validateInteger,
  );
  const searchProposalsMax = await ask(
    rl,
    'Maximum proposal-count filter',
    String(existingSearchProfile?.filters?.proposalsMax ?? searchTemplate.filters.proposalsMax ?? 4),
    true,
    validateInteger,
  );
  const stopWhenConnectsBelow = await ask(
    rl,
    'Stop applying when connects drop below',
    String(
      existingSearchProfile?.thresholds?.stopWhenConnectsBelow ??
        searchTemplate.thresholds.stopWhenConnectsBelow ??
        15,
    ),
    true,
    validateInteger,
  );

  const searchProfile = {
    keywords: parseKeywords(searchKeywordsInput),
    filters: {
      contractorTier: existingSearchProfile?.filters?.contractorTier ?? searchTemplate.filters.contractorTier ?? 3,
      hourlyRateMin: Number.parseInt(searchHourlyRateMin, 10),
      paymentVerified:
        existingSearchProfile?.filters?.paymentVerified ?? searchTemplate.filters.paymentVerified ?? true,
      proposalsMax: Number.parseInt(searchProposalsMax, 10),
    },
    thresholds: {
      hourlyFloor:
        parseMoney(profile.hourlyMinimum) ??
        existingSearchProfile?.thresholds?.hourlyFloor ??
        searchTemplate.thresholds.hourlyFloor ??
        40,
      fixedPriceMin:
        parseMoney(profile.fixedPriceMinimum) ??
        existingSearchProfile?.thresholds?.fixedPriceMin ??
        searchTemplate.thresholds.fixedPriceMin ??
        5000,
      stopWhenConnectsBelow: Number.parseInt(stopWhenConnectsBelow, 10),
    },
    skipRules: {
      hardGeoRestrictions:
        existingSearchProfile?.skipRules?.hardGeoRestrictions ??
        searchTemplate.skipRules.hardGeoRestrictions ??
        true,
      videoOnlyApplications:
        existingSearchProfile?.skipRules?.videoOnlyApplications ??
        searchTemplate.skipRules.videoOnlyApplications ??
        true,
      citizenshipOrClearanceLocks:
        existingSearchProfile?.skipRules?.citizenshipOrClearanceLocks ??
        searchTemplate.skipRules.citizenshipOrClearanceLocks ??
        true,
    },
  };

  await fs.mkdir(configDir, { recursive: true });
  await fs.writeFile(profilePath, renderApplicantProfile(profile), 'utf8');
  await fs.writeFile(searchProfilePath, `${JSON.stringify(searchProfile, null, 2)}\n`, 'utf8');

  console.log(`Wrote ${profilePath}`);
  console.log(`Wrote ${searchProfilePath}`);
  } finally {
    rl.close();
  }
}

function parseKeywords(inputValue) {
  return inputValue
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseMoney(value) {
  const match = String(value || '').match(/(\d[\d,]*)/);
  return match ? Number.parseInt(match[1].replaceAll(',', ''), 10) : null;
}

function validateYears(value) {
  return /\d/.test(value) ? true : 'Enter a number or number-like value.';
}

function validateMoneyLike(value) {
  return parseMoney(value) !== null ? true : 'Enter a value like $40/hr or $5000.';
}

function validateInteger(value) {
  return /^\d+$/.test(value) ? true : 'Enter a whole number.';
}

function validateKeywordList(value) {
  return parseKeywords(value).length > 0 ? true : 'Enter at least one keyword.';
}

async function ask(rl, label, defaultValue, required, validator = () => true) {
  const normalizedDefault = defaultValue ?? '';

  while (true) {
    const suffix = normalizedDefault ? ` [${normalizedDefault}]` : '';
    const raw = await rl.question(`${label}${suffix}: `);
    const value = (raw.trim() || normalizedDefault || '').trim();

    if (!value && required) {
      console.log('This field is required.');
      continue;
    }

    const validation = validator(value);
    if (validation === true) return value;
    console.log(validation);
  }
}

async function confirm(rl, label, defaultYes) {
  const suffix = defaultYes ? ' [Y/n]: ' : ' [y/N]: ';
  const raw = (await rl.question(`${label}${suffix}`)).trim().toLowerCase();

  if (!raw) return defaultYes;
  return ['y', 'yes'].includes(raw);
}

async function loadJson(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch {
    return null;
  }
}

async function loadMarkdownBullets(filePath) {
  try {
    const text = await fs.readFile(filePath, 'utf8');
    const entries = {};
    for (const line of text.split('\n')) {
      const match = line.match(/^- ([^:]+):\s*(.*)$/);
      if (match) {
        entries[match[1]] = match[2].trim();
      }
    }
    return entries;
  } catch {
    return null;
  }
}

function defaultSearchProfile() {
  return {
    keywords: [],
    filters: {
      contractorTier: 3,
      hourlyRateMin: 35,
      paymentVerified: true,
      proposalsMax: 4,
    },
    thresholds: {
      hourlyFloor: 40,
      fixedPriceMin: 5000,
      stopWhenConnectsBelow: 15,
    },
    skipRules: {
      hardGeoRestrictions: true,
      videoOnlyApplications: true,
      citizenshipOrClearanceLocks: true,
    },
  };
}

function renderApplicantProfile(profile) {
  return `# Applicant Profile

## Summary

- Name: ${profile.name}
- Positioning: ${profile.positioning}
- Years of experience: ${profile.years}
- Location and timezone: ${profile.locationTimezone}

## Core stack

- Frontend: ${profile.frontend}
- Backend: ${profile.backend}
- Database: ${profile.database}
- Cloud and DevOps: ${profile.cloudDevops}

## AI and automation

- Models and APIs: ${profile.modelsApis}
- Agent frameworks and orchestration: ${profile.orchestration}
- Automation platforms: ${profile.automationPlatforms}
- Production proof points: ${profile.productionProof}

## Current work

- Project 1: ${profile.currentProject1}
- Project 2: ${profile.currentProject2}

## Personal or flagship project

- Project: ${profile.flagshipProject}
- Why it proves fit: ${profile.flagshipWhy}

## Rate and engagement floor

- Hourly minimum: ${profile.hourlyMinimum}
- Fixed-price minimum: ${profile.fixedPriceMinimum}
- Hard no-go patterns: ${profile.hardNoGoPatterns}

## Proposal rules

- Preferred tone: ${profile.preferredTone}
- Required opening: ${profile.requiredOpening}
- Topics to emphasize: ${profile.topicsToEmphasize}
- Topics to avoid: ${profile.topicsToAvoid}

## Compliance rules

- Off-platform contact info allowed before contract: no
- CV attachment allowed in proposals: no
- Other notes: ${profile.otherNotes}
`;
}
