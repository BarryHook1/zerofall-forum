# Onboarding Info Pages Design

Date: `2026-04-14`

Scope: replace shallow placeholder content on `/welcome`, `/rules`, `/status`, and `/faq` with premium, read-only forum-owned informational surfaces.

## Goals

- Turn the four pages into real onboarding and reference content.
- Keep every page strictly forum-only and read-only.
- Preserve the existing premium dark visual language.
- Make the content fast to scan instead of text-heavy.

## Constraints

- Do not touch `zerofall-bot`.
- Do not touch Discord automation, webhook contracts, or outbox logic.
- Do not change `/staff/discord-sync`, `/staff/jobs`, `/staff/members`, `/staff/incidents`.
- Do not change `/dashboard`, `/activation`, or `/reactivation`.
- Do not create new APIs or integrations.
- Use only stable product facts already established in the forum.

## Content Direction

Tone: balanced.

- Premium and controlled, not sterile.
- Clear and authoritative, not legalistic.
- Welcoming enough for onboarding, but still firm about access boundaries.

Format: scannable.

- Cards, grids, timelines, and short sections.
- Minimal long-form prose.
- Each page should have one dominant organizing structure.

## Page Designs

### `/welcome`

Purpose:

- explain the private ecosystem
- orient newly provisioned members
- show the lifecycle from Genesis entry to active membership

Structure:

- Intro card explaining that the user is entering a private, controlled ecosystem.
- Four-step visual flow:
  - `Genesis`
  - `Account Created`
  - `Activation`
  - `Membership`
- Source-of-truth section clarifying:
  - the forum owns account and membership state
  - Discord is only a mirror of forum state
- “What happens next” section describing the expected onboarding sequence in plain language.

### `/rules`

Purpose:

- define community expectations
- define revocation boundaries
- define access-control policy

Structure:

- Opening statement about private access and conduct standards.
- Rule grid for:
  - conduct
  - account integrity
  - respect for controlled access
  - no abuse of private surfaces
- Controlled-access section stating:
  - no free public registration
  - no unrestricted open signup
  - account creation follows the forum’s controlled entry path
- Revocation section stating that access may be revoked for:
  - fraud or payment abuse
  - attempts to bypass controlled entry
  - repeated rule violations
  - misuse of private access

### `/status`

Purpose:

- explain the product’s state model
- make lifecycle transitions legible without exposing internal operations

Structure:

- Intro block explaining that status is tracked by the forum.
- State matrix covering:
  - `visitor`
  - `entry_pending`
  - `entry_confirmed`
  - `awaiting_activation`
  - `active`
  - `dormant`
  - `decayed`
  - `revoked`
- Each state gets:
  - what it means
  - what it implies for access at a high level
- High-level transition section showing:
  - `visitor -> entry_pending -> entry_confirmed -> awaiting_activation -> active`
  - `active -> dormant -> decayed`
  - `revoked` as terminal enforcement state
- Closing note that the forum is the canonical source of truth for status.

### `/faq`

Purpose:

- answer real MVP questions without sending users into staff or operational surfaces

Coverage:

- entry and Genesis path
- when UID is issued
- what activation deadline means
- when membership begins
- what happens when membership becomes dormant or decayed
- why Discord can differ temporarily from the forum
- what revoke means

Structure:

- Stacked FAQ cards with short, direct answers.
- Answers should avoid speculative details and stay within stable product rules.

## Visual System

- Reuse `SiteShell`, `Card`, `Badge`, and existing spacing conventions.
- Keep the premium dark background and chrome already established in the forum.
- Avoid building interactive controls or action surfaces.
- Visual emphasis should come from composition and typography hierarchy, not new functionality.

## Testing and Validation

- No new route handlers or API tests expected.
- Validation should be:
  - `npm test`
  - `npm run build`

## Out of Scope

- Any operational controls
- Any staff workflow changes
- Any dashboard logic changes
- Any webhook, HMAC, outbox, or Discord contract changes
