# Forum Core MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first working Zerofall forum core MVP with public Genesis entry, private member core, transactional UID issuance, internal membership billing, staff tooling, Discord webhook delivery, and lifecycle tests.

**Architecture:** Use a single Next.js application with App Router, Prisma, Auth.js, and Stripe. Keep the forum as the source of truth, model lifecycle transitions in server-side services, and deliver Discord events through a persistent webhook outbox with retries.

**Tech Stack:** Next.js 16, TypeScript, PostgreSQL, Prisma, Auth.js v5, Stripe, Tailwind CSS, shadcn/ui, Vitest

---

## File Structure Map

### Root and config

- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `eslint.config.mjs`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `README.md`

### Prisma and database

- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`

### App routes

- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`
- Create: `src/app/(public)/page.tsx`
- Create: `src/app/(public)/genesis/page.tsx`
- Create: `src/app/(public)/login/page.tsx`
- Create: `src/app/(public)/status/page.tsx`
- Create: `src/app/(public)/faq/page.tsx`
- Create: `src/app/(private)/dashboard/page.tsx`
- Create: `src/app/(private)/welcome/page.tsx`
- Create: `src/app/(private)/rules/page.tsx`
- Create: `src/app/(private)/activation/page.tsx`
- Create: `src/app/(private)/membership/page.tsx`
- Create: `src/app/(private)/billing/page.tsx`
- Create: `src/app/(private)/renewals/page.tsx`
- Create: `src/app/(private)/reactivation/page.tsx`
- Create: `src/app/(private)/account-standing/page.tsx`
- Create: `src/app/(private)/uid/page.tsx`
- Create: `src/app/(private)/ranks/page.tsx`
- Create: `src/app/(private)/badges/page.tsx`
- Create: `src/app/(staff)/staff/page.tsx`
- Create: `src/app/(staff)/staff/payments/page.tsx`
- Create: `src/app/(staff)/staff/activations/page.tsx`
- Create: `src/app/(staff)/staff/decay/page.tsx`
- Create: `src/app/(staff)/staff/incidents/page.tsx`
- Create: `src/app/(staff)/staff/discord-sync/page.tsx`

### API routes

- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/app/api/genesis/checkout/route.ts`
- Create: `src/app/api/membership/checkout/route.ts`
- Create: `src/app/api/stripe/webhooks/route.ts`
- Create: `src/app/api/staff/requeue-webhook/route.ts`
- Create: `src/app/api/staff/revoke-user/route.ts`
- Create: `src/app/api/staff/reactivate-user/route.ts`
- Create: `src/app/api/staff/update-rank/route.ts`
- Create: `src/app/api/internal/jobs/webhook-deliveries/route.ts`
- Create: `src/app/api/internal/jobs/activation-expiry/route.ts`
- Create: `src/app/api/internal/jobs/subscription-expiry/route.ts`
- Create: `src/app/api/internal/jobs/decay/route.ts`

### Components

- Create: `src/components/layout/site-shell.tsx`
- Create: `src/components/public/hero.tsx`
- Create: `src/components/public/feature-grid.tsx`
- Create: `src/components/dashboard/status-card-grid.tsx`
- Create: `src/components/dashboard/recent-events.tsx`
- Create: `src/components/dashboard/action-panel.tsx`
- Create: `src/components/staff/staff-user-search.tsx`
- Create: `src/components/staff/staff-log-table.tsx`
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/table.tsx`

### Server-side domain

- Create: `src/lib/auth/config.ts`
- Create: `src/lib/auth/session.ts`
- Create: `src/lib/db/prisma.ts`
- Create: `src/lib/formatting/uid.ts`
- Create: `src/lib/permissions/access.ts`
- Create: `src/lib/permissions/guards.ts`
- Create: `src/lib/lifecycle/enums.ts`
- Create: `src/lib/lifecycle/transitions.ts`
- Create: `src/lib/audit/logging.ts`
- Create: `src/lib/discord/signature.ts`
- Create: `src/lib/discord/payloads.ts`
- Create: `src/lib/billing/stripe.ts`
- Create: `src/server/repositories/user-repository.ts`
- Create: `src/server/repositories/purchase-repository.ts`
- Create: `src/server/repositories/subscription-repository.ts`
- Create: `src/server/repositories/webhook-delivery-repository.ts`
- Create: `src/server/services/uid-service.ts`
- Create: `src/server/services/entry-service.ts`
- Create: `src/server/services/membership-service.ts`
- Create: `src/server/services/webhook-delivery-service.ts`
- Create: `src/server/services/staff-service.ts`
- Create: `src/server/jobs/process-webhook-deliveries.ts`
- Create: `src/server/jobs/process-activation-expiry.ts`
- Create: `src/server/jobs/process-subscription-expiry.ts`
- Create: `src/server/jobs/process-decay.ts`

### Tests

- Create: `tests/unit/uid-service.test.ts`
- Create: `tests/unit/lifecycle-transitions.test.ts`
- Create: `tests/unit/webhook-delivery-service.test.ts`
- Create: `tests/integration/entry-provisioning.test.ts`
- Create: `tests/integration/membership-activation.test.ts`
- Create: `tests/integration/lifecycle-jobs.test.ts`
- Create: `tests/integration/route-guards.test.ts`

## Task 1: Scaffold the application and install the toolchain

**Files:**
- Create: root config files

- [ ] **Step 1: Bootstrap a Next.js app with TypeScript and App Router**

Run:

```bash
npx create-next-app@latest . --ts --app --tailwind --eslint --src-dir --use-npm --import-alias "@/*"
```

Expected:
- Next.js app files exist in the repository root
- `src/app` exists
- `package.json` contains `next`, `react`, `react-dom`

- [ ] **Step 2: Install project dependencies**

Run:

```bash
npm install @auth/prisma-adapter @prisma/client auth.js bcryptjs stripe zod date-fns lucide-react clsx tailwind-merge
npm install -D prisma vitest @vitest/coverage-v8 @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/bcryptjs
```

Expected:
- dependency install completes without lockfile conflicts

- [ ] **Step 3: Set up base scripts**

Update `package.json` scripts to include:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest run",
  "test:watch": "vitest",
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev",
  "prisma:seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 4: Verify the scaffold builds**

Run:

```bash
npm run build
```

Expected:
- successful production build

## Task 2: Define Prisma schema, enums, and seed data

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Test: `tests/unit/lifecycle-transitions.test.ts`

- [ ] **Step 1: Write failing lifecycle enum test**

Add a test that asserts the application exports the expected state enums and transition guards.

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
npm test -- tests/unit/lifecycle-transitions.test.ts
```

Expected:
- fail because lifecycle files do not exist yet

- [ ] **Step 3: Implement the Prisma schema**

Model:
- all user lifecycle enums
- `users`
- `entry_purchases`
- `activation_windows`
- `subscriptions`
- `ranks`
- `badges`
- `discord_sync_logs`
- `webhook_deliveries`
- `audit_logs`
- `uid_sequence`

Initialize `uid_sequence` with one `forum_uid` row in seed data.

- [ ] **Step 4: Implement lifecycle enum exports**

Create `src/lib/lifecycle/enums.ts` and `src/lib/lifecycle/transitions.ts` with the explicit allowed transitions from the spec.

- [ ] **Step 5: Generate Prisma client and run schema validation**

Run:

```bash
npm run prisma:generate
```

Expected:
- Prisma client generated successfully

- [ ] **Step 6: Re-run lifecycle tests**

Run:

```bash
npm test -- tests/unit/lifecycle-transitions.test.ts
```

Expected:
- lifecycle enum test passes

## Task 3: Build database access, formatting helpers, and audit logging

**Files:**
- Create: `src/lib/db/prisma.ts`
- Create: `src/lib/formatting/uid.ts`
- Create: `src/lib/audit/logging.ts`
- Create: repository files
- Test: `tests/unit/uid-service.test.ts`

- [ ] **Step 1: Write failing UID formatting and generation tests**

Test:
- format `1` to `#0001`
- reject UID issuance before paid entry state
- increment UID monotonically

- [ ] **Step 2: Run UID tests and verify they fail**

Run:

```bash
npm test -- tests/unit/uid-service.test.ts
```

Expected:
- fail because UID service does not exist

- [ ] **Step 3: Implement Prisma singleton and repositories**

Create focused repository helpers for users, purchases, subscriptions, and webhook deliveries.

- [ ] **Step 4: Implement UID formatting and audit helpers**

Create:
- numeric to display formatter
- audit log writer that stores `event_type`, `user_id`, `actor_id`, and metadata

- [ ] **Step 5: Implement `uid-service.ts`**

Support:
- transactional sequence increment
- single-use issuance after paid entry confirmation
- no UID reuse

- [ ] **Step 6: Re-run UID tests**

Run:

```bash
npm test -- tests/unit/uid-service.test.ts
```

Expected:
- tests pass

## Task 4: Implement Auth.js with closed registration

**Files:**
- Create: `src/lib/auth/config.ts`
- Create: `src/lib/auth/session.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Write failing route guard test**

Add a test proving a visitor cannot access `/dashboard`.

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
npm test -- tests/integration/route-guards.test.ts
```

Expected:
- fail because auth and guards are not implemented

- [ ] **Step 3: Implement Auth.js configuration**

Support:
- credentials login only
- bcrypt password verification
- session fields for `id`, `role`, `membershipStatus`, `rank`

- [ ] **Step 4: Implement guard helpers**

Create permission helpers that distinguish:
- public
- awaiting activation
- active
- dormant
- decayed
- staff

- [ ] **Step 5: Re-run route guard tests**

Run:

```bash
npm test -- tests/integration/route-guards.test.ts
```

Expected:
- visitor access is blocked correctly

## Task 5: Implement the public Genesis flow and entry checkout

**Files:**
- Create: public route pages
- Create: `src/app/api/genesis/checkout/route.ts`
- Create: `src/lib/billing/stripe.ts`
- Create: `src/server/services/entry-service.ts`
- Test: `tests/integration/entry-provisioning.test.ts`

- [ ] **Step 1: Write failing entry provisioning tests**

Test:
- pending entry does not create user
- paid entry creates user once
- paid entry creates activation window

- [ ] **Step 2: Run the tests and verify they fail**

Run:

```bash
npm test -- tests/integration/entry-provisioning.test.ts
```

Expected:
- fail because entry service and checkout route do not exist

- [ ] **Step 3: Build public pages**

Implement:
- premium dark landing page
- Genesis page with call to action
- login, status, and FAQ pages

- [ ] **Step 4: Implement entry checkout route**

Create a Stripe Checkout session for the Genesis Drop and persist `entry_pending`.

- [ ] **Step 5: Implement `entry-service.ts`**

Handle:
- checkout session creation
- Stripe event normalization
- entry confirmation transaction
- audit log creation

- [ ] **Step 6: Re-run entry tests**

Run:

```bash
npm test -- tests/integration/entry-provisioning.test.ts
```

Expected:
- provisioning tests pass for the entry path

## Task 6: Implement Stripe webhook processing for account creation and initial activation window

**Files:**
- Create: `src/app/api/stripe/webhooks/route.ts`
- Modify: `src/server/services/entry-service.ts`
- Modify: repositories and audit helpers
- Test: `tests/integration/entry-provisioning.test.ts`

- [ ] **Step 1: Add a failing test for Stripe entry confirmation**

Test:
- processing a successful entry webhook provisions the account exactly once

- [ ] **Step 2: Run the Stripe entry test and verify it fails**

Run:

```bash
npm test -- tests/integration/entry-provisioning.test.ts -t "provisions the account exactly once"
```

Expected:
- fail because webhook route and idempotent provisioning are incomplete

- [ ] **Step 3: Implement Stripe webhook verification**

Validate signature and route events to entry or membership handlers.

- [ ] **Step 4: Implement idempotent entry provisioning**

Within one transaction:
- mark purchase paid
- create account
- issue UID
- create activation window
- set `awaiting_activation`
- enqueue `member.created`

- [ ] **Step 5: Re-run Stripe entry tests**

Run:

```bash
npm test -- tests/integration/entry-provisioning.test.ts
```

Expected:
- all entry tests pass

## Task 7: Implement private dashboard and core member pages

**Files:**
- Create: dashboard and private pages
- Create: dashboard components
- Modify: layout and guard usage

- [ ] **Step 1: Write failing dashboard render test**

Test that an awaiting-activation member sees:
- state
- formatted UID
- activation deadline
- membership action panel

- [ ] **Step 2: Run the dashboard test and verify it fails**

Run:

```bash
npm test -- tests/integration/route-guards.test.ts -t "awaiting activation member dashboard"
```

Expected:
- fail because dashboard UI does not exist

- [ ] **Step 3: Build the premium dashboard UI**

Render:
- status
- UID
- rank
- badge status
- membership state
- activation deadline
- Discord linked state
- account standing
- recent events

- [ ] **Step 4: Build core private pages**

Implement minimal but coherent pages for:
- welcome
- rules
- activation
- membership
- billing
- renewals
- reactivation
- account standing
- UID
- ranks
- badges

- [ ] **Step 5: Re-run dashboard tests**

Run:

```bash
npm test -- tests/integration/route-guards.test.ts
```

Expected:
- dashboard render and access rules pass

## Task 8: Implement membership checkout and activation flow

**Files:**
- Create: `src/app/api/membership/checkout/route.ts`
- Modify: `src/server/services/membership-service.ts`
- Test: `tests/integration/membership-activation.test.ts`

- [ ] **Step 1: Write failing membership activation tests**

Test:
- only eligible members can open membership checkout
- successful membership payment moves user to `active`
- activation window records `activated_at`

- [ ] **Step 2: Run the tests and verify they fail**

Run:

```bash
npm test -- tests/integration/membership-activation.test.ts
```

Expected:
- fail because membership checkout and activation logic do not exist

- [ ] **Step 3: Implement membership checkout route**

Require:
- authenticated user
- confirmed entry
- non-revoked account

- [ ] **Step 4: Implement `membership-service.ts`**

Handle:
- checkout session creation
- subscription creation or update
- first activation
- renewal
- expiration
- reactivation

- [ ] **Step 5: Re-run membership tests**

Run:

```bash
npm test -- tests/integration/membership-activation.test.ts
```

Expected:
- membership activation tests pass

## Task 9: Implement staff routes and operational actions

**Files:**
- Create: staff pages and components
- Create: staff API routes
- Create: `src/server/services/staff-service.ts`

- [ ] **Step 1: Write failing staff action test**

Test:
- staff can force revoke a user
- staff action creates audit log
- non-staff cannot invoke staff endpoints

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
npm test -- tests/integration/route-guards.test.ts -t "staff"
```

Expected:
- fail because staff actions do not exist

- [ ] **Step 3: Build staff surfaces**

Implement:
- overview
- payments
- activations
- decay
- incidents
- Discord sync log

- [ ] **Step 4: Implement staff action routes and service**

Support:
- search by UID
- inspect member record
- force revoke
- force reactivate
- update rank
- requeue webhook delivery

- [ ] **Step 5: Re-run staff tests**

Run:

```bash
npm test -- tests/integration/route-guards.test.ts
```

Expected:
- staff authorization and actions pass

## Task 10: Implement Discord payload building, signing, outbox, and retry worker

**Files:**
- Create: `src/lib/discord/signature.ts`
- Create: `src/lib/discord/payloads.ts`
- Create: `src/server/services/webhook-delivery-service.ts`
- Create: `src/server/jobs/process-webhook-deliveries.ts`
- Create: internal jobs route
- Test: `tests/unit/webhook-delivery-service.test.ts`

- [ ] **Step 1: Write failing webhook delivery tests**

Test:
- signs payload with HMAC
- creates unique delivery IDs
- records failed attempts
- retries pending deliveries

- [ ] **Step 2: Run the tests and verify they fail**

Run:

```bash
npm test -- tests/unit/webhook-delivery-service.test.ts
```

Expected:
- fail because webhook delivery service does not exist

- [ ] **Step 3: Implement canonical and compatibility payload serializers**

Emit:
- canonical forum event payload
- compatibility payload for the current `zerofall-bot`

- [ ] **Step 4: Implement webhook signing and outbox persistence**

Add:
- HMAC signature generation
- outbox row creation
- delivery state transitions

- [ ] **Step 5: Implement retry worker and route**

Process pending deliveries with bounded retry and backoff.

- [ ] **Step 6: Re-run webhook delivery tests**

Run:

```bash
npm test -- tests/unit/webhook-delivery-service.test.ts
```

Expected:
- webhook delivery tests pass

## Task 11: Implement activation expiry, subscription expiry, and decay jobs

**Files:**
- Create: lifecycle job files
- Create: internal job routes
- Test: `tests/integration/lifecycle-jobs.test.ts`

- [ ] **Step 1: Write failing lifecycle job tests**

Test:
- expired activation window revokes awaiting member
- expired active subscription moves member to dormant
- eligible dormant member moves to decayed

- [ ] **Step 2: Run the tests and verify they fail**

Run:

```bash
npm test -- tests/integration/lifecycle-jobs.test.ts
```

Expected:
- fail because jobs do not exist

- [ ] **Step 3: Implement activation expiry job**

Handle:
- deadline lookup
- revoke transition
- audit log
- `account.revoked` webhook queue

- [ ] **Step 4: Implement subscription expiry and decay jobs**

Handle:
- dormant transition
- decayed transition
- audit logs
- downstream Discord events

- [ ] **Step 5: Re-run lifecycle job tests**

Run:

```bash
npm test -- tests/integration/lifecycle-jobs.test.ts
```

Expected:
- lifecycle job tests pass

## Task 12: Final integration pass, docs, and verification

**Files:**
- Modify: `README.md`
- Modify: `.env.example`
- Review: all touched files

- [ ] **Step 1: Add environment variable documentation**

Document:
- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_ENTRY_PRICE_ID`
- `STRIPE_MEMBERSHIP_PRICE_ID`
- `DISCORD_WEBHOOK_URL`
- `DISCORD_WEBHOOK_SECRET`
- `INTERNAL_JOB_SECRET`

- [ ] **Step 2: Add local run instructions**

Document:
- install
- migrate
- seed
- run dev
- run tests

- [ ] **Step 3: Run full test suite**

Run:

```bash
npm test
```

Expected:
- all unit and integration tests pass

- [ ] **Step 4: Run lint and build**

Run:

```bash
npm run build
```

Expected:
- successful build

- [ ] **Step 5: Review final diff and commit**

Run:

```bash
git status --short
git add .
git commit -m "feat: build zerofall forum core mvp"
```

Expected:
- clean working tree after commit

## Self-Review

### Spec coverage

Covered:
- schema
- enums and lifecycle
- auth
- Genesis entry flow
- transactional UID
- account creation after payment
- dashboard
- billing pages
- status pages
- staff area
- webhook emitter
- retry queue
- lifecycle tests

Deferred by design:
- full discussion forum mechanics
- advanced fraud systems
- Discord OAuth linking automation

### Placeholder scan

No `TBD` or `TODO` placeholders remain. Each task names concrete files and explicit commands.

### Type consistency

The plan consistently uses:
- `forum_uid`
- `entry_status`
- `membership_status`
- `activation_window`
- `webhook_deliveries`
- `uid_sequence`

Execution default for this session: inline execution in the current session, because the user already asked to proceed and did not request delegated subagents.
