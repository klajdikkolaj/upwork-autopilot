#!/usr/bin/env node
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFile = fileURLToPath(import.meta.url);
const pluginRoot = path.resolve(path.dirname(currentFile), '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(pluginRoot, 'package.json'), 'utf8'));

const commandTable = {
  'install-home': {
    runner: 'bash',
    script: 'scripts/install-home.sh',
    description: 'Install or refresh the Codex plugin in ~/plugins and marketplace.json.',
  },
  bootstrap: {
    runner: 'bash',
    script: 'scripts/bootstrap.sh',
    description: 'Install package dependencies in the plugin directory.',
  },
  'setup-profile': {
    runner: 'node',
    script: 'scripts/setup-applicant-profile.mjs',
    description: 'Create or update the private applicant profile.',
  },
  'search-plan': {
    runner: 'node',
    script: 'scripts/upwork-search-plan.mjs',
    description: 'Show the configured Upwork search plan.',
  },
  'search-inspect': {
    runner: 'node',
    script: 'scripts/upwork-search-inspect.mjs',
    description: 'Inspect Upwork search results. Usage: search-inspect <query> [detail] [index]',
  },
  probe: {
    runner: 'node',
    script: 'scripts/upwork-session-probe.mjs',
    description: 'Probe the live Upwork browser session.',
  },
  launch: {
    runner: 'bash',
    script: 'scripts/launch-controlled-chrome.sh',
    description: 'Launch the default controlled Chrome profile.',
  },
  'launch-controlled': {
    runner: 'bash',
    script: 'scripts/launch-controlled-chrome.sh',
    description: 'Launch Chrome using the configured controlled mode.',
  },
  'launch-logged-in': {
    runner: 'bash',
    script: 'scripts/launch-logged-in-chrome.sh',
    description: 'Launch the machine Chrome profile with CDP enabled.',
  },
  'launch-isolated': {
    runner: 'bash',
    script: 'scripts/launch-isolated-chrome.sh',
    description: 'Launch an isolated Chrome profile.',
  },
  'apply-probe': {
    runner: 'node',
    script: 'scripts/upwork-apply-probe.mjs',
    description: 'Open and inspect a job application page. Usage: apply-probe <job-url>',
  },
  'submit-proposal': {
    runner: 'node',
    script: 'scripts/upwork-submit-proposal.mjs',
    description: 'Submit a proposal payload. Usage: submit-proposal <proposal-url> <payload-json>',
  },
  validate: {
    runner: 'bash',
    script: 'scripts/validate.sh',
    description: 'Run local validation checks.',
  },
  'package-release': {
    runner: 'bash',
    script: 'scripts/package-release.sh',
    description: 'Build a local release archive under dist/.',
  },
  'export-github': {
    runner: 'bash',
    script: 'scripts/export-github-repo.sh',
    description: 'Export a GitHub-ready copy under dist/github-repo/.',
  },
};

const aliases = {
  help: '--help',
  version: '--version',
  root: '--root',
};

function printHelp() {
  console.log(`Upwork Autopilot ${packageJson.version}

Usage:
  upwork-autopilot <command> [args]

Commands:`);

  const width = Math.max(...Object.keys(commandTable).map((name) => name.length));
  for (const [name, command] of Object.entries(commandTable)) {
    console.log(`  ${name.padEnd(width)}  ${command.description}`);
  }

  console.log(`
Options:
  -h, --help       Show this help.
  -v, --version    Print the package version.
      --root       Print the installed plugin root.
`);
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: pluginRoot,
      env: process.env,
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`Command terminated with signal ${signal}`));
        return;
      }

      resolve(code ?? 0);
    });
  });
}

async function main() {
  const [rawCommand, ...args] = process.argv.slice(2);
  const commandName = aliases[rawCommand] ?? rawCommand;

  if (!commandName || commandName === '-h' || commandName === '--help') {
    printHelp();
    return 0;
  }

  if (commandName === '-v' || commandName === '--version') {
    console.log(packageJson.version);
    return 0;
  }

  if (commandName === '--root') {
    console.log(pluginRoot);
    return 0;
  }

  const command = commandTable[commandName];
  if (!command) {
    console.error(`Unknown command: ${rawCommand}`);
    console.error('Run upwork-autopilot --help for available commands.');
    return 1;
  }

  const runner = command.runner === 'node' ? process.execPath : command.runner;
  return run(runner, [command.script, ...args]);
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
