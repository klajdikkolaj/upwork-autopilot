# Search Strategy

Use these defaults unless the user gives a different search plan. Prefer `../config/search-profile.local.json` when it exists. The onboarding script writes that file for each user.

## Base search URL

```text
https://www.upwork.com/nx/search/jobs/?contractor_tier=3&hourly_rate=35-&payment_verified=1&proposals=0-4&q=KEYWORD&sort=relevance%2Bdesc&t=0
```

## Default keyword set

1. `Next.js React senior developer TypeScript fullstack`
2. `AI agent developer Claude API OpenAI LLM`
3. `n8n automation workflow AI agent`
4. `NestJS Node.js backend API developer`
5. `Go golang microservices backend developer`
6. `Supabase PostgreSQL fullstack developer`
7. `AI integration developer LLM automation`
8. `fullstack developer React Node AI startup`

## Qualification rules

- Client must be payment verified.
- Prefer jobs with `Proposals: Less than 5`.
- Skip jobs with hard location locks that exclude Albania or Europe.
- Skip jobs that already show an applied banner.
- Skip video-first applications unless the user explicitly wants them.
- Skip jobs whose practical rate ceiling does not support the user's floor.
- Treat Web3-only, SEO-only, and training-only posts as weak fits unless the user explicitly wants them.

## Good signals

- Next.js, React, TypeScript
- Node.js, NestJS, Go, microservices
- Supabase, PostgreSQL, PostGIS
- n8n, automation, APIs, SaaS integrations
- AI assistants, agent systems, orchestration, productized LLM work
- Architecture review, technical lead, systems validation

## Workflow rule

The live Upwork browser session is stateful. Do not run multiple navigation scripts in parallel against it.

## Configured search plan

When a user-specific search profile exists, generate the actual URLs with:

```bash
node ../scripts/upwork-search-plan.mjs
```

That output should drive the real Upwork search loop.
