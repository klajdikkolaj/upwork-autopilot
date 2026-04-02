# Upwork Autopilot

Codex plugin for controlled Upwork job search, qualification, and proposal submission sessions.

## What it does

- launches a dedicated Chrome profile with CDP enabled
- asks each user for their own applicant profile and search defaults
- probes whether the live Upwork session is logged in
- searches filtered Upwork job results
- opens and probes proposal pages before submission
- submits proposals from ordered payload JSON files
- logs successful submissions to JSONL
- keeps the public plugin generic while storing private applicant data in local-only config files

## Core rule set

- proposals must start with `Hi,`
- tone must stay friendly and professional
- no off-platform contact details
- do not attach the CV
- do not run concurrent browser navigation against the live Upwork tab
- stop once available Connects fall below `15`

## Repo layout

```text
.codex-plugin/
config/
docs/
examples/
references/
scripts/
skills/
```

`config/*.template.*` files are public and safe to commit.

`config/*.local.*` files are private user data and are ignored by git and excluded from release archives.

## Quick start

```bash
cd /path/to/upwork-autopilot
bash scripts/bootstrap.sh
node scripts/setup-applicant-profile.mjs
bash scripts/launch-controlled-chrome.sh
node scripts/upwork-session-probe.mjs
```

## Main commands

```bash
node scripts/setup-applicant-profile.mjs
node scripts/upwork-search-plan.mjs
node scripts/upwork-search-inspect.mjs 'AI integration developer LLM automation'
node scripts/upwork-search-inspect.mjs 'AI integration developer LLM automation' detail 0
node scripts/upwork-apply-probe.mjs '<job-url>'
node scripts/upwork-submit-proposal.mjs '<proposal-url>' /abs/path/to/payload.json
bash scripts/validate.sh
bash scripts/package-release.sh
bash scripts/export-github-repo.sh
```

## Install for personal use

```bash
bash scripts/install-home.sh
```

This installs the plugin into `~/plugins/upwork-autopilot` and updates `~/.agents/plugins/marketplace.json`.

## Publish as a standalone GitHub repo

1. Run `bash scripts/export-github-repo.sh`
2. Change into the exported repo under `dist/github-repo/upwork-autopilot`
3. Follow [docs/PUBLISHING.md](./docs/PUBLISHING.md)

The export keeps:

- plugin manifest
- skills
- scripts
- docs
- templates
- examples

The export removes:

- `node_modules`
- local applicant config
- local search config
- runtime logs
- previous build artifacts

## Validation

Run:

```bash
bash scripts/validate.sh
```

This checks shell syntax, Node script syntax, and runs Codex skill validation when the local validator is available.

## Example payload

See [examples/proposal-payload.example.json](./examples/proposal-payload.example.json).

For multi-question forms, keep `textareas` and `inputs` in the same order the page presents them.
