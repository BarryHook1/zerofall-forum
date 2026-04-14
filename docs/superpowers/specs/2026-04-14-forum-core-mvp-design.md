# Zerofall Forum Core MVP Design

**Project:** `zerofall-forum`

**Objective**

Build the first private ecosystem application for Zerofall using a single Next.js codebase that contains the public Genesis landing flow and the private member core. The forum application is the system of record for identity, billing, lifecycle state, UID issuance, ranks, badges, logs, and Discord synchronization. The existing `zerofall-bot` remains an external consumer of forum webhooks.

## Scope

This design covers only the first implementation cycle, `Forum Core MVP`.

Included:
- Public landing pages and Genesis entry route
- Closed registration via entry purchase only
- Stripe-powered entry checkout
- Stripe-powered membership checkout inside the private area
- Transactional account creation after entry payment confirmation
- Transactional, sequential UID issuance after entry payment confirmation
- Member dashboard and core private pages
- Staff tools for status inspection and operational actions
- Forum to Discord webhook emitter with retry support
- Audit and operational logs
- Role-based route protection and page-level access control
- Automated tests for the core lifecycle

Explicitly deferred:
- Full discussion threads, post composer, moderation queue, reactions, and search
- Complex decay engine with reputation formulas
- Fraud review workflows beyond manual revoke support
- Advanced billing plans, coupons, taxation, and regional payment variation
- Discord OAuth or bot-managed account linking automation
- Background cron fleet beyond the minimum retry and lifecycle jobs needed for the MVP

## Product Positioning

The MVP is not a generic public forum. It is a controlled private operating surface for the Genesis Drop and the first membership lifecycle.

The public layer exists only to:
- explain the Genesis Drop
- answer common questions
- gate entry
- send the user into the private system after payment

The private layer exists to:
- hold the source-of-truth member record
- expose internal billing
- manage state changes
- show UID, rank, badges, and account standing
- give staff enough tools to operate the lifecycle safely

Discord is downstream only. It mirrors forum state and never decides who a valid member is.

## Architecture

### Recommended shape

Use a single Next.js application for the MVP.

Reasons:
- one database and one domain model for user lifecycle
- one authentication boundary
- simpler Stripe integration
- simpler webhook emission
- less deployment overhead
- avoids a premature split between marketing and private product surfaces

### System components

1. `Public web`
   Serves `/`, `/genesis`, `/login`, `/status`, `/faq`.

2. `Private app`
   Serves authenticated pages such as `/dashboard`, `/membership`, `/billing`, `/uid`, and staff routes.

3. `Database`
   PostgreSQL via Prisma. This stores the canonical member record, purchases, subscriptions, lifecycle windows, ranks, badges, webhook deliveries, and logs.

4. `Stripe integration`
   Handles:
   - entry payment checkout session creation
   - membership checkout session creation
   - webhook processing for entry and recurring membership events

5. `Webhook outbox`
   Reliable delivery mechanism from forum to Discord bot. Emits signed HTTP requests, tracks status, stores failures, and retries idempotently.

6. `Discord bot integration`
   External dependency. Receives events from forum and applies Discord-side roles and access.

## Tech Stack

- `Next.js 16`
- `TypeScript`
- `PostgreSQL`
- `Prisma`
- `Auth.js v5`
- `Stripe`
- `Tailwind CSS`
- `shadcn/ui`
- `Vitest`

## Domain Rules

### Access

- No public free signup exists.
- Entry begins only through the Genesis Drop.
- The landing page sells entry only.
- Internal recurring membership pricing is not visible on public routes.

### UID

- UID is generated only after entry payment is confirmed.
- UID is never generated at pre-checkout or pending checkout time.
- UID is sequential and monotonic.
- UID is never reused, even if the account is later revoked.
- UID generation must be transactional.
- Stored value is numeric. UI renders it as `#0001`, `#0002`, and so on.

### Activation

- After entry payment confirmation and account creation, the user enters `awaiting_activation`.
- The system creates an activation deadline.
- If the user does not complete the initial membership purchase by the deadline, the account becomes `revoked`.

### Membership

- Recurring membership is only available inside the private application.
- Membership can only be purchased by a valid member with confirmed entry.
- In the MVP, a user becomes `active` when membership payment is successfully activated.

### Lifecycle

- Membership expiration moves the user to `dormant`.
- Further decay processes can move the user to `decayed`.
- Revoked members lose access according to policy.

## User State Machine

The lifecycle state machine is explicit and must be implemented as domain rules, not informal UI logic.

### States

- `visitor`
- `entry_pending`
- `entry_confirmed`
- `awaiting_activation`
- `active`
- `dormant`
- `decayed`
- `revoked`

### Semantics

- `visitor`
  Public-only user with no account in the private ecosystem.

- `entry_pending`
  Stripe entry checkout started, but payment not yet confirmed.

- `entry_confirmed`
  Entry payment confirmed. This is a transitional state used during provisioning.

- `awaiting_activation`
  Account exists, UID has been issued, and the member must activate the internal recurring membership before the deadline.

- `active`
  Membership is currently valid.

- `dormant`
  Membership expired recently; access is reduced but reactivation is allowed.

- `decayed`
  Extended inactivity or prestige loss state; premium access is further reduced.

- `revoked`
  Access revoked due to activation failure, fraud, or staff action.

### Allowed transitions

- `visitor -> entry_pending`
- `entry_pending -> entry_confirmed`
- `entry_confirmed -> awaiting_activation`
- `awaiting_activation -> active`
- `awaiting_activation -> revoked`
- `active -> dormant`
- `dormant -> active`
- `dormant -> decayed`
- `decayed -> active`
- `active -> revoked`
- `dormant -> revoked`
- `decayed -> revoked`

Transitions not listed above should be rejected at the service layer.

## Data Model

### `users`

Canonical member record.

Fields:
- `id` `uuid` primary key
- `username` `text` unique
- `email` `text` unique
- `password_hash` `text`
- `discord_id` `text` nullable
- `forum_uid` `integer` nullable unique
- `entry_status` enum
- `membership_status` enum
- `rank` enum
- `badge_status` enum
- `activation_deadline` `timestamp` nullable
- `subscription_expires_at` `timestamp` nullable
- `decay_state` enum nullable
- `last_sync_at` `timestamp` nullable
- `created_at` `timestamp`
- `updated_at` `timestamp`

### `entry_purchases`

Tracks Genesis entry purchases.

Fields:
- `id` `uuid` primary key
- `user_id` `uuid` nullable until account creation is completed
- `provider` enum
- `provider_payment_id` `text` unique
- `provider_checkout_session_id` `text` unique
- `email` `text`
- `amount` `integer`
- `currency` `text`
- `status` enum
- `paid_at` `timestamp` nullable
- `created_at` `timestamp`

### `activation_windows`

Tracks activation deadlines and outcomes.

Fields:
- `id` `uuid` primary key
- `user_id` `uuid` unique
- `deadline_at` `timestamp`
- `activated_at` `timestamp` nullable
- `revoked_at` `timestamp` nullable
- `created_at` `timestamp`

### `subscriptions`

Tracks internal recurring membership subscriptions.

Fields:
- `id` `uuid` primary key
- `user_id` `uuid`
- `plan_code` enum
- `provider` enum
- `provider_subscription_id` `text` unique
- `status` enum
- `starts_at` `timestamp`
- `expires_at` `timestamp`
- `canceled_at` `timestamp` nullable
- `created_at` `timestamp`
- `updated_at` `timestamp`

### `ranks`

Tracks historical rank grants.

Fields:
- `id` `uuid` primary key
- `user_id` `uuid`
- `rank_code` enum
- `granted_at` `timestamp`
- `revoked_at` `timestamp` nullable

### `badges`

Tracks historical badge status.

Fields:
- `id` `uuid` primary key
- `user_id` `uuid`
- `badge_code` enum
- `status` enum
- `granted_at` `timestamp`
- `revoked_at` `timestamp` nullable

### `discord_sync_logs`

Tracks outbound Discord webhook delivery results.

Fields:
- `id` `uuid` primary key
- `user_id` `uuid`
- `event_name` `text`
- `payload_json` `jsonb`
- `status` enum
- `error_message` `text` nullable
- `processed_at` `timestamp` nullable
- `created_at` `timestamp`

### `webhook_deliveries`

Reliable outbox queue for forum-to-Discord webhook delivery.

Fields:
- `id` `uuid` primary key
- `user_id` `uuid` nullable
- `event_name` `text`
- `delivery_id` `text` unique
- `target_url` `text`
- `payload_json` `jsonb`
- `signature` `text`
- `status` enum
- `attempt_count` `integer`
- `next_attempt_at` `timestamp`
- `last_attempt_at` `timestamp` nullable
- `last_error` `text` nullable
- `processed_at` `timestamp` nullable
- `created_at` `timestamp`

### `audit_logs`

Immutable operational log for core business events.

Fields:
- `id` `uuid` primary key
- `user_id` `uuid` nullable
- `actor_id` `uuid` nullable
- `event_type` `text`
- `meta_json` `jsonb`
- `created_at` `timestamp`

### `uid_sequence`

Dedicated sequence table for transactional UID issuance.

Fields:
- `name` `text` primary key
- `current_value` `integer`

One row only for `forum_uid`.

## Enums

### Entry status

- `visitor`
- `entry_pending`
- `entry_confirmed`
- `revoked`

### Membership status

- `none`
- `awaiting_activation`
- `active`
- `dormant`
- `decayed`
- `revoked`

### Rank

- `none`
- `verified`
- `elite`
- `vanguard`
- `genesis_founder`

### Badge status

- `disabled`
- `enabled`

### Decay state

- `none`
- `dormant`
- `decayed`

### Purchase status

- `pending`
- `paid`
- `failed`
- `refunded`
- `canceled`

### Subscription status

- `pending`
- `active`
- `past_due`
- `expired`
- `canceled`
- `revoked`

### Webhook delivery status

- `pending`
- `processing`
- `succeeded`
- `failed`

## Transaction Design

### Entry confirmation transaction

When Stripe confirms the Genesis entry purchase, the system must execute provisioning in a single database transaction:

1. lock or resolve the paid `entry_purchase`
2. validate it has not already been provisioned
3. create `user`
4. increment `uid_sequence`
5. assign `forum_uid`
6. set user state to `entry_confirmed`
7. create `activation_window`
8. set user membership state to `awaiting_activation`
9. create `audit_logs` for payment confirmation, UID issuance, account creation, and deadline creation
10. enqueue `member.created` webhook delivery

If any step fails, the transaction rolls back and no partial account or UID remains.

### Membership activation transaction

When Stripe confirms the membership purchase:

1. resolve the user
2. create or update `subscription`
3. mark `activation_window.activated_at` if first activation
4. set user membership state to `active`
5. set expiration metadata
6. create audit entries
7. enqueue `subscription.activated`

## Authentication

Use `Auth.js` with credentials.

Rules:
- users cannot self-register from a public sign-up form
- only users created by confirmed entry payment can log in
- staff can create privileged accounts through seeded or admin-only paths
- session middleware must protect all private and staff routes

## Route Surface

### Public routes

- `/`
- `/genesis`
- `/login`
- `/status`
- `/faq`

### Private routes

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

### Staff routes

- `/staff`
- `/staff/payments`
- `/staff/activations`
- `/staff/decay`
- `/staff/incidents`
- `/staff/discord-sync`

## Access Control

Authorization should be enforced with middleware plus server-side guards.

### Visitor

Allowed:
- `/`
- `/genesis`
- `/login`
- `/status`
- `/faq`

### Awaiting activation

Allowed:
- `/dashboard`
- `/welcome`
- `/rules`
- `/activation`
- `/membership`
- `/billing`
- `/account-standing`

Blocked:
- community-only prestige areas
- advanced member areas
- staff areas

### Active member

Allowed:
- all core private routes
- status surfaces
- support surfaces
- prestige routes according to rank

### Dormant member

Allowed:
- `/dashboard`
- `/billing`
- `/renewals`
- `/reactivation`
- `/account-standing`
- limited status/history views

### Decayed member

Allowed:
- `/dashboard`
- `/billing`
- `/reactivation`
- `/account-standing`
- basic support/history views

### Staff

Allowed:
- all staff routes
- operational action forms

## Public and Private Information Design

Public pages must not expose internal billing, member-only content, private categories, or indexed internal structures.

Private pages should visually establish:
- controlled access
- silent prestige
- dark premium interface
- minimal motion
- low-noise surfaces

Design language:
- dark mode only
- matte black backgrounds
- graphite grays
- cold silver accents
- restrained typography
- minimal borders
- no loud gaming visuals

## Page Responsibilities

### `/genesis`

Purpose:
- explain the drop
- clarify the entry gate
- begin Stripe entry checkout

Must not show:
- internal recurring pricing
- active member areas
- forum internals

### `/dashboard`

Displays:
- current state
- formatted UID
- rank
- badge status
- membership state
- activation deadline
- Discord linked status
- account standing
- recent events

Actions:
- activate membership
- renew
- reactivate
- link Discord placeholder
- view account logs

### `/membership`

Displays:
- membership overview
- current eligibility
- plan availability
- next billing actions

### `/billing`

Displays:
- payment status
- entry purchase summary
- current subscription summary
- relevant Stripe actions

### Staff pages

Must support:
- search by UID
- search by email
- search by username
- inspect full lifecycle
- force revoke
- force reactivation
- update rank
- requeue webhook
- inspect failed sync

## Forum to Discord Webhooks

The forum emits signed HTTP POST requests to the bot.

### Endpoint

`POST /api/webhooks/forum`

### Headers

- `x-zf-signature`
- `x-zf-event`
- `x-zf-delivery-id`

### Security

- HMAC signature using shared secret
- request body signed exactly as sent
- unique delivery ID per event delivery
- idempotency expected on receiver side
- sender stores attempts and failures

### MVP event set

- `member.created`
- `subscription.activated`
- `subscription.renewed`
- `subscription.expired`
- `member.decayed`
- `member.reactivated`
- `rank.updated`
- `account.revoked`

### Payload shape

```json
{
  "event": "member.created",
  "user_id": "uuid",
  "forum_uid": 42,
  "discord_id": "1234567890",
  "username": "membername",
  "entry_status": "entry_confirmed",
  "membership_status": "awaiting_activation",
  "rank": "genesis_founder",
  "badge_status": "enabled",
  "activation_deadline": "2026-05-20T23:59:59Z"
}
```

The forum must also expose an adapter layer so it can emit a compatibility payload for the current `zerofall-bot`, which today expects `discordUserId`, `uid`, `forumMemberId`, `rank`, `expiresAt`, and an event name. The MVP sender should support the canonical payload internally and a temporary compatibility serializer for the existing bot until the bot contract is upgraded.

## Stripe Integration Rules

### Entry

- create checkout session from `/genesis`
- mark purchase `pending`
- wait for Stripe webhook
- on successful payment, execute entry confirmation transaction

### Membership

- only eligible members can open membership checkout
- membership checkout is initiated from private pages only
- on successful activation, update subscription and member state
- on expiration or cancellation, update subscription and member state

## Jobs

Minimum background jobs for the MVP:

1. `webhook retry worker`
   Sends pending Discord webhook deliveries and retries failures with backoff.

2. `activation expiry worker`
   Revokes users still in `awaiting_activation` after their deadline.

3. `membership expiry worker`
   Marks recently expired subscriptions as `dormant`.

4. `decay promotion worker`
   Moves eligible dormant users to `decayed`.

Jobs may run via route-triggered worker entrypoints, server runtime jobs, or platform cron integration depending on deployment constraints, but they must remain idempotent.

## Logging and Audit

The following events must generate audit entries:
- payment confirmed
- UID issued
- account created
- activation deadline created
- activation completed
- membership renewed
- membership expired
- member decayed
- member reactivated
- account revoked
- rank updated
- webhook queued
- webhook failed
- webhook delivered
- Discord sync completed

Staff pages should read from these logs rather than infer state from raw operational tables alone.

## Testing Strategy

The MVP must ship with automated coverage for:

1. entry purchase confirmation creates account only once
2. UID is issued only after successful entry payment
3. UID is sequential and non-reusable
4. awaiting activation users are revoked after deadline
5. membership activation moves user to `active`
6. expiration moves user to `dormant`
7. decay worker moves eligible users to `decayed`
8. route guards enforce access correctly
9. webhook emitter signs payloads and records retries
10. staff actions create audit entries

Use a mix of:
- domain service unit tests
- Prisma-backed integration tests
- route or handler tests for payment and webhook flows

## Folder Structure Target

The codebase should be organized around responsibilities rather than giant generic folders.

Target shape:

```text
src/
  app/
    (public)/
    (auth)/
    (private)/
    (staff)/
    api/
  components/
    public/
    dashboard/
    staff/
    ui/
  lib/
    auth/
    billing/
    lifecycle/
    permissions/
    discord/
    audit/
    db/
    formatting/
  server/
    services/
    jobs/
    repositories/
    webhooks/
prisma/
  schema.prisma
  seed.ts
tests/
  integration/
  unit/
  fixtures/
```

## Implementation Order

Follow this order:

1. database schema
2. enums and domain models
3. authentication
4. Genesis entry flow
5. transactional UID generation
6. account creation after payment
7. private dashboard
8. billing pages
9. status surfaces for UID, rank, badges
10. staff area
11. webhook emitter
12. retry queue
13. full lifecycle tests

## Open Decisions Closed For MVP

The following decisions are explicitly fixed:

- stack is `Next.js + PostgreSQL + Prisma + Auth.js`
- LP and private app live in the same repository and application for the MVP
- Stripe is the payment provider for entry and recurring membership
- a user becomes `active` when membership is successfully paid
- the forum is the source of truth
- Discord is downstream only

## Spec Review

### Placeholder scan

No placeholders remain. Deferred items are intentionally out of scope, not missing details.

### Internal consistency

The state machine, UID issuance rules, Stripe flow, and webhook model are aligned. `entry_confirmed` is a provisioning transition and `awaiting_activation` is the persisted post-provisioning state before membership activation.

### Scope check

This spec is intentionally limited to `Forum Core MVP`. Full forum discussions and richer community mechanics are deferred to later implementation cycles.

### Ambiguity check

The activation trigger for the MVP is explicitly defined as successful membership payment only. Discord linking is visible in the dashboard but not required for activation in this cycle.
