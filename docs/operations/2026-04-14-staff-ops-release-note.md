# Staff Ops Release Note

Date: `2026-04-14`

Scope: forum-only operational improvements for Discord webhook outbox management and internal job observability.

## What Changed

- Expanded `/staff/discord-sync` with server-side filters:
  - `status`
  - `eventName`
  - `hasError`
  - `skipReason`
- Added server-side pagination for webhook deliveries.
- Added `Recent Failures` and `Stuck Retries` views.
- Added protected bulk action for failed webhook requeue.
- Added `/staff/jobs` for operational visibility into:
  - `webhook-deliveries`
  - `activation-expiry`
  - `subscription-expiry`
  - `decay`
- Added persistent `job_runs` tracking with:
  - latest run
  - success or failure
  - processed count
  - summarized error

## Boundary Confirmation

- No changes to `zerofall-bot`
- No new Discord-state assumptions
- No new bot coupling
- Forum remains publish-only to the canonical bot endpoint:
  - `POST /api/webhooks/forum`

## Database Change

New migration:

- `20260414190000_add_job_runs`

New table:

- `job_runs`

## Deploy Order

1. Apply migrations:

```bash
npm run prisma:migrate:deploy
```

2. Deploy the forum app.

3. Run deploy smoke helper:

```bash
FORUM_BASE_URL=https://<forum-host> \
INTERNAL_JOB_SECRET=<internal-job-secret> \
npm run ops:smoke:staff
```

4. Optional authenticated staff page smoke:

```bash
FORUM_BASE_URL=https://<forum-host> \
INTERNAL_JOB_SECRET=<internal-job-secret> \
STAFF_COOKIE='name=value; other=value' \
npm run ops:smoke:staff
```

## Validation Targets

- `/staff/discord-sync`
- `/staff/jobs`
- `/staff/incidents`
- All four internal job routes return `200`
- New job runs appear in `job_runs`
- Bulk requeue returns success and records audit events

## Risk Profile

Risk level: low to moderate

Reasons:

- additive schema change
- no bot changes
- no changes to webhook contract
- primary impact is on staff surfaces and internal observability

Main rollout risk:

- deploying app code before applying the `job_runs` migration

## Rollback

If the app deploy causes issues:

- roll back forum application code first
- leave `job_runs` in place; the migration is additive
- verify internal job auth and webhook outbox still function

## Evidence

Verified in repo before handoff:

- `npm test`
- `npm run lint`
- `npm run build`
