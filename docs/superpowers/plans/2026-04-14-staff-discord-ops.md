# Staff Discord Ops Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve staff operation of forum-owned webhook deliveries and internal jobs without adding any new bot coupling.

**Architecture:** Keep all state and observability inside the forum. Extend the staff Discord sync query to support server-side filters, pagination, failure slices, and bulk requeue; add a small persistent job-run table and wrap each internal job with success/failure recording so staff can inspect the forum's own automation health without SQL.

**Tech Stack:** Next.js 16 App Router, TypeScript, Prisma 7, PostgreSQL, Tailwind CSS, Vitest

---

## File Structure Map

- Modify: `prisma/schema.prisma`
- Modify: `src/server/queries/staff-discord-sync.ts`
- Modify: `src/server/services/staff-service.ts`
- Modify: `src/server/jobs/process-webhook-deliveries.ts`
- Modify: `src/server/jobs/process-subscription-expiry.ts`
- Modify: `src/server/jobs/process-decay.ts`
- Modify: `src/server/jobs/process-activation-expiry.ts`
- Modify: `src/app/staff/discord-sync/page.tsx`
- Modify: `src/app/staff/discord-sync/requeue-webhook-button.tsx`
- Modify: `src/app/staff/page.tsx`
- Modify: `src/app/api/staff/requeue-webhook/route.ts`
- Create: `src/app/api/staff/requeue-all-webhooks/route.ts`
- Create: `src/app/staff/jobs/page.tsx`
- Create: `src/server/services/job-run-service.ts`
- Create: `src/server/queries/staff-job-runs.ts`
- Create: `src/app/staff/discord-sync/requeue-all-webhooks-button.tsx`
- Create: `tests/unit/staff-job-runs.test.ts`
- Create: `tests/integration/staff-requeue-webhooks-route.test.ts`
- Modify: `tests/unit/staff-discord-sync.test.ts`
- Modify: `tests/integration/route-guards.test.ts`

## Task 1: Add failing tests for the new operational requirements

**Files:**
- Modify: `tests/unit/staff-discord-sync.test.ts`
- Create: `tests/unit/staff-job-runs.test.ts`
- Create: `tests/integration/staff-requeue-webhooks-route.test.ts`
- Modify: `tests/integration/route-guards.test.ts`

- [ ] Write failing tests for query filter helpers, skip reason extraction, and stuck/failure summaries.
- [ ] Run the focused tests and verify they fail for the expected missing APIs.
- [ ] Add failing tests for bulk requeue auth and payload handling on the new staff route.
- [ ] Add failing tests for job run summarization and latest-run aggregation.

## Task 2: Persist forum job runs

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/server/services/job-run-service.ts`
- Create: `src/server/queries/staff-job-runs.ts`

- [ ] Add a `JobRun` model keyed by forum job name with timestamps, status, processed count, and summarized error.
- [ ] Implement a small service that records start, success, and failure without leaking job internals into route handlers.
- [ ] Add a query that returns the latest run per job plus recent history for the staff page.

## Task 3: Expand Discord sync operations

**Files:**
- Modify: `src/server/queries/staff-discord-sync.ts`
- Modify: `src/server/services/staff-service.ts`
- Modify: `src/app/api/staff/requeue-webhook/route.ts`
- Create: `src/app/api/staff/requeue-all-webhooks/route.ts`

- [ ] Add server-side filter parsing for status, event name, has-error, and skipped reason.
- [ ] Add server-side pagination via cursor or load-more token.
- [ ] Add recent-failure and stuck-retry slices to the overview query.
- [ ] Add a bulk requeue service method for failed deliveries only.
- [ ] Protect the new route with `requireApiPathAccess("/staff/discord-sync")`.

## Task 4: Update staff surfaces

**Files:**
- Modify: `src/app/staff/discord-sync/page.tsx`
- Modify: `src/app/staff/discord-sync/requeue-webhook-button.tsx`
- Create: `src/app/staff/discord-sync/requeue-all-webhooks-button.tsx`
- Create: `src/app/staff/jobs/page.tsx`
- Modify: `src/app/staff/page.tsx`

- [ ] Add premium/dark filter controls and load-more navigation on the Discord sync page.
- [ ] Add recent failures and stuck retries cards without changing the forum-to-bot boundary.
- [ ] Add a protected “requeue all failed” action.
- [ ] Add a jobs operations page for `webhook-deliveries`, `subscription-expiry`, `decay`, and `activation-expiry`.
- [ ] Link the new jobs page from the staff index.

## Task 5: Instrument internal jobs

**Files:**
- Modify: `src/server/jobs/process-webhook-deliveries.ts`
- Modify: `src/server/jobs/process-subscription-expiry.ts`
- Modify: `src/server/jobs/process-decay.ts`
- Modify: `src/server/jobs/process-activation-expiry.ts`

- [ ] Wrap each job in the shared recorder so every run writes started/finished state.
- [ ] Record success/failure, processed counts, and compact error summaries.
- [ ] Keep existing job auth and forum-owned side effects unchanged.

## Task 6: Verify end to end

**Files:**
- None

- [ ] Run the focused test files until green.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Review the diff to confirm only forum files changed and no bot coupling was introduced.
