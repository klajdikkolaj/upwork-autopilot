#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFile = fileURLToPath(import.meta.url);
const pluginRoot = path.resolve(path.dirname(currentFile), '..');
const packageJsonPath = path.join(pluginRoot, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const npmBin = process.env.NPM_BIN || 'npm';
const packDir = path.join(pluginRoot, 'dist', 'npm');
const formulaPath = path.join(pluginRoot, 'Formula', 'upwork-autopilot.rb');
const checkOnly = process.argv.includes('--check');

function fail(message) {
  console.error(message);
  process.exit(1);
}

function rubyString(value) {
  return JSON.stringify(value);
}

function runNpmPack() {
  fs.mkdirSync(packDir, { recursive: true });

  const result = spawnSync(npmBin, ['pack', '--json', '--pack-destination', packDir], {
    cwd: pluginRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });

  if (result.error) {
    fail(`Failed to run ${npmBin}: ${result.error.message}`);
  }

  if (result.status !== 0) {
    fail(`${npmBin} pack failed with exit code ${result.status}`);
  }

  let packed;
  try {
    packed = JSON.parse(result.stdout);
  } catch (error) {
    fail(`Could not parse npm pack output: ${error.message}`);
  }

  const firstPack = packed[0];
  if (!firstPack?.filename) {
    fail('npm pack did not report a tarball filename.');
  }

  return path.isAbsolute(firstPack.filename)
    ? firstPack.filename
    : path.join(packDir, firstPack.filename);
}

function buildFormula({ sha256 }) {
  const description = 'Codex plugin for controlled Upwork application sessions';
  const homepage = packageJson.homepage || 'https://github.com/klajdikkolaj/upwork-autopilot';
  const license = packageJson.license || 'MIT';
  const tarballUrl = `https://registry.npmjs.org/${packageJson.name}/-/${packageJson.name}-${packageJson.version}.tgz`;

  return `# typed: false
# frozen_string_literal: true

class UpworkAutopilot < Formula
  desc ${rubyString(description)}
  homepage ${rubyString(homepage)}
  url ${rubyString(tarballUrl)}
  sha256 ${rubyString(sha256)}
  license ${rubyString(license)}

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink libexec/"bin/upwork-autopilot"
  end

  def caveats
    <<~EOS
      Install or refresh the Codex plugin marketplace entry:
        upwork-autopilot install-home

      Then configure your local applicant profile:
        upwork-autopilot setup-profile
    EOS
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/upwork-autopilot --version")
    assert_match "install-home", shell_output("#{bin}/upwork-autopilot --help")
  end
end
`;
}

const tarballPath = runNpmPack();
const sha256 = createHash('sha256').update(fs.readFileSync(tarballPath)).digest('hex');
const formula = buildFormula({ sha256 });

if (checkOnly) {
  if (!fs.existsSync(formulaPath)) {
    fail(`Missing ${path.relative(pluginRoot, formulaPath)}. Run npm run brew:formula.`);
  }

  const currentFormula = fs.readFileSync(formulaPath, 'utf8');
  if (currentFormula !== formula) {
    fail(`Homebrew formula is stale. Run npm run brew:formula.`);
  }

  console.log(`Homebrew formula is current for ${packageJson.name}@${packageJson.version}.`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(formulaPath), { recursive: true });
fs.writeFileSync(formulaPath, formula);

console.log(`Updated ${path.relative(pluginRoot, formulaPath)}`);
console.log(`${path.relative(pluginRoot, tarballPath)}  sha256=${sha256}`);
