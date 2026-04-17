# Staff Ops Deploy Checklist

Scope: deploy the forum-only staff Discord operations and job observability changes introduced on `2026-04-14`.

Boundary reminders:
- Do not change the bot during this rollout.
- Forum remains publisher-only for Discord events.
- Canonical bot endpoint stays `POST /api/webhooks/forum`.

## Pre-Deploy

- Confirm the deploy target is the forum app, not `zerofall-bot`.
- Confirm the target environment has the expected secrets:
  - `DATABASE_URL`
  - `DISCORD_WEBHOOK_URL`
  - `DISCORD_WEBHOOK_SECRET`
  - `INTERNAL_JOB_SECRET`
  - `CRON_SECRET`
- Confirm the target environment already points `DISCORD_WEBHOOK_URL` at the canonical bot route:
  - `https://<bot-host>/api/webhooks/forum`
- Confirm the build is green on the commit being deployed:
  - `npm test`
  - `npm run build`

## Database Rollout

- Apply Prisma migrations before switching traffic:

```bash
npm run prisma:migrate:deploy
```

- Verify the new migration is present:
  - `20260414190000_add_job_runs`
- Verify the new table exists:
  - `job_runs`

## Deploy

- Deploy the forum application normally for the target host.
- Do not modify cron schedules during this release. Current forum cron routes are:
  - `/api/internal/jobs/webhook-deliveries`
  - `/api/internal/jobs/activation-expiry`
  - `/api/internal/jobs/subscription-expiry`
  - `/api/internal/jobs/decay`

## Staff Smoke Test

Log in as a staff user and verify:

- `/staff` shows links for:
  - `Discord Sync`
  - `Jobs`
- `/staff/discord-sync` loads without server errors.
- Discord Sync filters work:
  - `status`
  - `eventName`
  - `hasError`
  - `skipReason`
- Discord Sync pagination works with `Previous` and `Next`.
- `Recent Failures` renders.
- `Stuck Retries` renders.
- Single `Requeue` still works.
- Bulk `Requeue All Failed` returns a success response.
- `/staff/jobs` loads and renders the four tracked jobs:
  - `webhook-deliveries`
  - `activation-expiry`
  - `subscription-expiry`
  - `decay`

## Job Smoke Test

Run each forum job once against the deployed forum app.

Optional helper:

```bash
FORUM_BASE_URL=https://<forum-host> \
INTERNAL_JOB_SECRET=<internal-job-secret> \
npm run ops:smoke:staff
```

If you also want the script to verify the staff pages, add:

```bash
STAFF_COOKIE='name=value; other=value'
```

Using `INTERNAL_JOB_SECRET`:

```bash
curl -i -X POST "https://<forum-host>/api/internal/jobs/webhook-deliveries" \
  -H "x-internal-job-secret: $INTERNAL_JOB_SECRET"

curl -i -X POST "https://<forum-host>/api/internal/jobs/activation-expiry" \
  -H "x-internal-job-secret: $INTERNAL_JOB_SECRET"

curl -i -X POST "https://<forum-host>/api/internal/jobs/subscription-expiry" \
  -H "x-internal-job-secret: $INTERNAL_JOB_SECRET"

curl -i -X POST "https://<forum-host>/api/internal/jobs/decay" \
  -H "x-internal-job-secret: $INTERNAL_JOB_SECRET"
```

Expected response shape:

```json
{ "processed": 0 }
```

`processed` may be greater than `0` depending on live forum state.

## Post-Deploy Validation

After the job smoke test, confirm:

- `/staff/jobs` shows a fresh run for all four jobs.
- Successful jobs show:
  - latest run timestamp
  - `succeeded`
  - processed count
- Failed jobs show:
  - `failed`
  - non-empty `errorSummary`
- `/staff/incidents` still renders recent operational events.
- `/staff/discord-sync` still shows:
  - `discord.webhook_skipped`
  - `discord.webhook_queued`
  - `discord.webhook_requeued`
  - `discord.webhook_requeued_bulk`

## Rollback

If the forum app fails after deploy but the migration has already been applied:

- Roll back application code first.
- Do not immediately drop `job_runs`; it is additive and safe to leave in place.
- Re-verify:
  - staff auth
  - internal job auth
  - forum webhook outbox processing

## Done Criteria

This rollout is complete when all of the following are true:

- Migration applied successfully.
- Forum deploy is live.
- Staff pages `/staff/discord-sync` and `/staff/jobs` both work.
- All four internal jobs can be triggered manually.
- Fresh job runs are visible in `job_runs`-backed staff UI.
- No bot changes were required.
