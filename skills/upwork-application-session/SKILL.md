---
name: upwork-application-session
description: Use when the user wants to search Upwork, qualify roles, draft proposals, submit applications, or continue an active Upwork application session. This skill uses a Chrome CDP workflow, payload JSON files, sequential browser actions, connect-budget tracking, and final success confirmation through Upwork proposal URLs.
---

# Upwork Application Session

Use this skill for real Upwork application work. Prefer the Chrome CDP path. Only use Atlas if JavaScript execution is confirmed to work there.

## Read first

- First try `../../config/applicant-profile.local.md`
- If that file does not exist, run `node ../../scripts/setup-applicant-profile.mjs`
- Then read `../../config/search-profile.local.json` if it exists
- If the local search profile does not exist, use `../../config/search-profile.template.json`
- `../../references/search-strategy.md`

## Non-negotiables

- Start every cover letter with `Hi,`
- Tone: friendly, professional, specific, low-fluff.
- Never include email, phone, Telegram, WhatsApp, Calendly, or any off-platform contact detail in a proposal.
- Never attach the CV in this workflow.
- Do not parallelize browser actions against the live Upwork session.
- Stop when available Connects drop below `15`.
- Skip jobs that are already applied, blocked by hard geography, citizenship, or security constraints, or clearly below the user's floor.

## Setup

1. Run `../../scripts/bootstrap.sh` once from the plugin root.
2. Ensure the applicant profile exists. If it does not, run `node ../../scripts/setup-applicant-profile.mjs`.
2. If the user wants to reuse their real logged-in Chrome cookies, run `../../scripts/launch-logged-in-chrome.sh`.
3. Otherwise run `../../scripts/launch-controlled-chrome.sh` for a fully isolated browser profile.
4. Ask the user to log into Upwork only if the chosen browser mode is not already signed in.
5. Run `node ../../scripts/upwork-session-probe.mjs` to confirm login state.
6. Export a log path before submissions, for example:

```bash
export UPWORK_AUTOPILOT_LOG=$HOME/.codex/upwork-autopilot/logs/$(date +%F).jsonl
```

## Search and qualification

- List search results:

```bash
node ../../scripts/upwork-search-plan.mjs
```

- A raw keyword is converted into the default filtered Upwork search URL.
- A full Upwork search URL is accepted as-is.
- If `upwork-search-plan.mjs` returns multiple URLs, iterate them sequentially.
- To open a result and inspect the full job page:

```bash
node ../../scripts/upwork-search-inspect.mjs '<search-url-or-keyword>' detail 0
```

- To probe the apply flow for a specific job:

```bash
node ../../scripts/upwork-apply-probe.mjs '<job-url>'
```

Apply only if all of these hold:

- the client is payment verified
- the role is technically relevant
- the rate is compatible with the user's floor
- there is no hard location block
- the role is not already applied

## Proposal writing

Create a payload JSON file with `apply_patch`. The scripts fill fields in DOM order.

```json
{
  "textareas": [
    "Hi,\n\n..."
  ],
  "inputs": []
}
```

Rules:

- First paragraph: name the actual problem in the post.
- Middle section: 2 to 4 bullets that map profile strengths to the job.
- Proof section: use current work or Eternia only when relevant.
- Closing: one short call to action.
- Keep the proposal around `350` to `400` words unless the page asks multiple written questions.
- Answer written questions directly. Do not dodge them with generic sales copy.
- The first line must begin with `Hi,`

## Submission

Run:

```bash
node ../../scripts/upwork-submit-proposal.mjs '<proposal-url>' /abs/path/to/payload.json
```

Success is confirmed only when the final URL contains `?success`.

The submit script:

- fills visible `textarea` fields in order
- fills visible text, url, email, and number inputs in order
- clicks `Submit a proposal`
- extracts the success URL and proposal ID
- appends a JSONL log entry if `UPWORK_AUTOPILOT_LOG` is set

## Failure handling

- If the page opens a video interview flow, skip unless the user explicitly wants that path.
- If the apply button is disabled, read the probe output before deciding whether to skip.
- If `net::ERR_ABORTED` appears, another command touched the same Upwork tab. Resume with single-threaded browser actions only.
- If login, CAPTCHA, or 2FA appears, hand control to the user and resume after confirmation.
