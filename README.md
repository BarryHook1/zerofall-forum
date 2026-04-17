# Zerofall Forum

Private ecosystem core for Zerofall. This repository contains:

- the public Genesis landing flow
- closed access provisioning after paid entry
- internal membership billing
- private member dashboard
- member-facing status, UID, rank, badge, activation, renewal, and reactivation surfaces
- member-owned Discord link and unlink flow via Discord OAuth
- staff operational surfaces
- forum-to-Discord webhook delivery with retries

The forum is the source of truth. Discord mirrors forum state only.

## Stack

- `Next.js 16`
- `TypeScript`
- `PostgreSQL`
- `Prisma 7`
- `Auth.js / next-auth`
- `Stripe`
- `Tailwind CSS`
- `Vitest`

## Current MVP Coverage

- Genesis entry page and checkout route
- account creation only after paid entry confirmation
- transactional sequential UID issuance
- private dashboard and core member routes
- internal membership checkout route
- member status and billing surfaces for UID, ranks, badges, standing, renewals, and recovery
- Discord OAuth link and unlink managed by the forum
- staff routes and operational APIs
- webhook outbox to the Discord bot
- staff observability for internal forum jobs
- lifecycle jobs for activation expiry, subscription expiry, and decay
- tests for lifecycle transitions, UID, permissions, webhook retries, entry provisioning, and membership activation

## Environment

Copy `.env.example` to `.env` and adjust values:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/zerofall_forum
AUTH_SECRET=replace-me
AUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-me
NEXTAUTH_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_replace
STRIPE_WEBHOOK_SECRET=whsec_replace
STRIPE_ENTRY_PRICE_ID=price_entry_replace
STRIPE_MEMBERSHIP_PRICE_ID=price_membership_replace
DISCORD_WEBHOOK_URL=http://127.0.0.1:8787/api/webhooks/forum
DISCORD_WEBHOOK_SECRET=replace-me
DISCORD_OAUTH_CLIENT_ID=replace-me
DISCORD_OAUTH_CLIENT_SECRET=replace-me
INTERNAL_JOB_SECRET=replace-me
CRON_SECRET=replace-me
ZEROFALL_SEED_STAFF_JSON='[{"username":"founder","email":"founder@example.com","password":"change-me","accountRole":"founder","rank":"genesis_founder"}]'
```

## Local Run

Install dependencies:

```bash
npm install
```

Generate Prisma client:

```bash
npm run prisma:generate
```

If you already have PostgreSQL running locally, create the database and run migrations:

```bash
npm run prisma:migrate
```

For production or any non-dev deploy target, apply committed migrations with:

```bash
npm run prisma:migrate:deploy
```

Seed the UID sequence:

```bash
npm run prisma:seed
```

If `ZEROFALL_SEED_STAFF_JSON` is present, the seed also creates or updates staff users with valid hashed passwords and active access.

Start the app:

```bash
npm run dev
```

## Verification

Run tests:

```bash
npm test
```

Run the production build:

```bash
npm run build
```

Run the deploy smoke helper against a live forum environment:

```bash
FORUM_BASE_URL=https://forum.example.com \
INTERNAL_JOB_SECRET=replace-me \
npm run ops:smoke:staff
```

To also validate the authenticated staff pages, include a valid `STAFF_COOKIE`.

## Production Deploy

Recommended split:

- deploy the forum on `Vercel`
- deploy PostgreSQL on `Neon`, `Supabase`, or `RDS`
- deploy the bot on a persistent Node host such as `Railway`, `Fly.io`, or `Render`

Forum production env baseline is provided in [.env.production.example](/Users/arthurmonteiro/zerofall-forum/.env.production.example).

Important production notes:

- set both `NEXTAUTH_SECRET` and `NEXTAUTH_URL`
- keep `AUTH_SECRET` and `AUTH_URL` aligned if you want backward compatibility
- set `DISCORD_WEBHOOK_URL` to the bot public endpoint, normally `https://bot.<domain>/api/webhooks/forum`
- set `DISCORD_OAUTH_CLIENT_ID` and `DISCORD_OAUTH_CLIENT_SECRET` from your Discord application
- set the Discord OAuth redirect URL to `https://forum.<domain>/api/discord/callback`
- set `CRON_SECRET` in Vercel so cron-triggered job routes can authenticate with `Authorization: Bearer <CRON_SECRET>`
- keep `INTERNAL_JOB_SECRET` for manual operational calls and external schedulers
- `vercel.json` already schedules retry and lifecycle jobs

Operational release checklist:

- [docs/operations/2026-04-14-forum-release-checklist.md](/Users/arthurmonteiro/zerofall-forum/docs/operations/2026-04-14-forum-release-checklist.md)

## Forum To Bot Contract

The forum publishes events only. It does not inspect or repair Discord state.

Canonical bot endpoint:

- `POST /api/webhooks/forum`

Required forum env:

- `DISCORD_WEBHOOK_URL=https://<bot-host>/api/webhooks/forum`
- `DISCORD_WEBHOOK_SECRET=<same value as the bot ZEROFALL_WEBHOOK_SECRET>`

Allowed outbound events from the forum:

- `member.created`
- `subscription.activated`
- `subscription.expired`
- `subscription.decayed`
- `rank.granted`
- `rank.revoked`
- `account.revoked`

Payload contract:

- sends both `type` and `event` with the same value
- always sends `discordUserId`
- always sends `uid` in `UID0001` format
- always sends `forumMemberId`
- always sends `timestamp` in ISO-8601
- sends `rank` and `expiresAt` when relevant to the event

Operational behavior:

- if the forum user has no linked Discord account, the forum does not publish a malformed webhook
- skipped deliveries are recorded in `audit_logs` as `discord.webhook_skipped`
- queued deliveries are recorded in `audit_logs` as `discord.webhook_queued`
- manual retries are recorded as `discord.webhook_requeued` and `discord.webhook_requeued_bulk`
- delivery retries remain owned by the forum outbox
- internal job executions are recorded in `job_runs` with latest status, processed count, and summarized error

## Discord Link Flow

The forum owns Discord identity linking.

- `GET /api/discord/link` starts Discord OAuth for the authenticated forum member
- `GET /api/discord/callback` validates the forum-owned `state`, exchanges the code, and stores `discord_id`
- `POST /api/discord/unlink` removes the current `discord_id`

Operational notes:

- linking records `discord.account_link_started` and `discord.account_linked` in `audit_logs`
- unlinking records `discord.account_unlinked`
- after a successful link, the forum publishes one forum-owned sync event based on current lifecycle state:
  - `member.created`
  - `subscription.activated`
  - `subscription.expired`
  - `subscription.decayed`
  - `account.revoked`
- unlinking does not publish a bot event because there is no target `discordUserId`
- `discord_id` is unique per forum user and cannot be reused across accounts at the same time

## Important Routes

Public:

- `/`
- `/genesis`
- `/login`
- `/status`
- `/faq`

Private:

- `/dashboard`
- `/welcome`
- `/rules`
- `/activation`
- `/membership`
- `/billing`
- `/renewals`
- `/reactivation`
- `/account-standing`
- `/uid`
- `/ranks`
- `/badges`

Staff:

- `/staff`
- `/staff/members`
- `/staff/payments`
- `/staff/activations`
- `/staff/decay`
- `/staff/incidents`
- `/staff/discord-sync`
- `/staff/jobs`

Operational staff notes:

- `/staff/discord-sync` now exposes filtered webhook deliveries, skipped/queued audit events, retry state, pagination, and bulk requeue for failed deliveries
- `/staff/incidents` shows recent internal job runs and recent operational exceptions from the forum side

## Project Structure

```text
docs/
  superpowers/
    specs/
    plans/
prisma/
  schema.prisma
  seed.ts
src/
  app/
    api/
  components/
    auth/
    layout/
    public/
    ui/
  lib/
    audit/
    auth/
    billing/
    db/
    discord/
    formatting/
    lifecycle/
    permissions/
  server/
    jobs/
    repositories/
    services/
tests/
  integration/
  unit/
```

## Notes

- Prisma 7 uses `prisma.config.ts` for datasource configuration.
- The forum side is intentionally limited to the webhook boundary. It publishes events to the bot and does not attempt to model Discord state locally.
- The MVP base does not yet include full discussion threads or rich forum posting surfaces. It establishes the access, billing, lifecycle, and synchronization core first.
