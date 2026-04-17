# Zerofall Forum Release Checklist

This checklist is the shortest safe path to move `zerofall-forum` into staging or production without crossing the forum-to-bot boundary.

## Scope

This checklist covers only the forum application:

- database migrations
- forum env validation
- staff operational smoke checks
- Discord OAuth readiness
- forum-to-bot webhook boundary readiness

This checklist does not cover:

- Discord guild roles
- bot deployment internals
- command registration in the bot
- draw logic or any guild automation

## 1. Database

Apply committed migrations before the app deploy becomes live.

```bash
cd /Users/arthurmonteiro/zerofall-forum
npm run prisma:migrate:deploy
```

Expected:

- `20260414165000_init` applied
- `20260414190000_add_job_runs` applied
- `20260414203000_add_unique_discord_id` applied

## 2. Required Environment

The forum must have all of the following:

### Auth

- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

Backward-compatible fallback:

- `AUTH_SECRET`
- `AUTH_URL`

### Stripe

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_ENTRY_PRICE_ID`
- `STRIPE_MEMBERSHIP_PRICE_ID`

### Bot Boundary

- `DISCORD_WEBHOOK_URL=https://<bot-host>/api/webhooks/forum`
- `DISCORD_WEBHOOK_SECRET=<same value used by the bot>`

### Discord OAuth

- `DISCORD_OAUTH_CLIENT_ID`
- `DISCORD_OAUTH_CLIENT_SECRET`

Discord application redirect:

- `https://<forum-host>/api/discord/callback`

### Internal Operations

- `INTERNAL_JOB_SECRET`
- `CRON_SECRET`

## 3. Deploy Order

Use this exact order:

1. apply database migrations
2. deploy the forum
3. run the staff smoke checks
4. validate env health in `/staff/jobs`
5. validate webhook outbox in `/staff/discord-sync`
6. validate one forum lifecycle flow end to end

## 4. Staff Smoke

Run the operational smoke helper against the target forum:

```bash
cd /Users/arthurmonteiro/zerofall-forum
FORUM_BASE_URL=https://<forum-host> \
INTERNAL_JOB_SECRET=<secret> \
npm run ops:smoke:staff
```

Expected:

- `webhook-deliveries` returns `200`
- `activation-expiry` returns `200`
- `subscription-expiry` returns `200`
- `decay` returns `200`

If you also want authenticated page validation:

- provide `STAFF_COOKIE`
- validate:
  - `/staff`
  - `/staff/discord-sync`
  - `/staff/jobs`

## 5. Staff UI Checks

After deploy, check these pages directly:

### `/staff/jobs`

Expected:

- latest job runs visible
- env health visible
- no critical missing config for:
  - auth URL
  - Discord webhook URL
  - Discord webhook secret
  - Discord OAuth client
  - internal job secret
  - cron secret
  - Stripe config

### `/staff/discord-sync`

Expected:

- webhook deliveries visible
- skipped and queued audit events visible
- retry controls visible
- canonical webhook target is `/api/webhooks/forum`

### `/staff/members`

Expected:

- member search works by UID, username, or email
- staff actions work:
  - update rank
  - revoke
  - reactivate

## 6. Discord OAuth Validation

Validate the forum-side link flow only.

### Pre-check

In `/staff/jobs`, confirm:

- `Discord OAuth client` is `ready`
- the callback URL shown by the forum matches the Discord application redirect

### Live check

As an authenticated member:

1. open `/account-standing`
2. click `Link Discord`
3. complete Discord OAuth
4. return to the forum callback
5. confirm the page shows `Discord linked`

Expected forum-side results:

- `users.discord_id` populated
- `discord.account_link_started` logged
- `discord.account_linked` logged
- one bot sync event queued based on current lifecycle state

Then validate unlink:

1. click `Unlink Discord`
2. confirm the page shows `Discord unlinked`

Expected forum-side results:

- `users.discord_id` becomes `null`
- `discord.account_unlinked` logged
- no malformed webhook emitted on unlink

## 7. Webhook Boundary Validation

The forum must remain publisher-only.

Confirm:

- `DISCORD_WEBHOOK_URL` points to `/api/webhooks/forum`
- failed deliveries stay in forum outbox
- retries remain operable from `/staff/discord-sync`
- skipped deliveries log `discord.webhook_skipped`
- queued deliveries log `discord.webhook_queued`

Do not treat Discord state as authoritative during this check.

## 8. Business Flow Smoke

After deploy, validate one minimal forum lifecycle flow:

1. Genesis entry checkout succeeds
2. Stripe confirms payment
3. forum account is created
4. UID is issued
5. member enters `awaiting_activation`
6. `member.created` is queued if `discord_id` exists
7. membership checkout succeeds
8. user becomes `active`
9. `subscription.activated` is queued if `discord_id` exists

Expected forum-side evidence:

- `entry.payment_confirmed`
- `entry.uid_issued`
- `membership.activated`
- webhook outbox rows and audit logs

## 9. Rollback Triggers

Stop the rollout if any of these happen:

- migration fails
- `/staff/jobs` reports missing auth, Stripe, webhook, or cron config
- `/staff/discord-sync` shows malformed target URL
- Discord OAuth callback does not match the deployed forum host
- account state changes succeed in DB but the session does not reflect them
- Stripe webhooks are not reaching the forum

## 10. Post-Deploy Confirmation

Release is considered operationally ready when all of the following are true:

- migrations applied
- staff smoke passes
- `/staff/jobs` env health is clean enough for the target environment
- `/staff/discord-sync` is operational
- Discord link/unlink works on the forum
- one real lifecycle transition queues the expected webhook event
