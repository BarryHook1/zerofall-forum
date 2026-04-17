# Onboarding Info Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace placeholder content on `/welcome`, `/rules`, `/status`, and `/faq` with premium, read-only forum-owned informational pages.

**Architecture:** Keep the work isolated to the four target routes and simple render-time content. Add lightweight page-content tests that render the pages and assert the required forum-owned messaging is present, then implement the new layouts with existing `SiteShell`, `Card`, and `Badge` components.

**Tech Stack:** Next.js 16 App Router, TypeScript, React 19, Tailwind CSS, Vitest

---

## File Structure Map

- Modify: `src/app/welcome/page.tsx`
- Modify: `src/app/rules/page.tsx`
- Modify: `src/app/status/page.tsx`
- Modify: `src/app/faq/page.tsx`
- Create: `tests/unit/onboarding-pages.test.ts`

## Task 1: Lock required content with failing tests

**Files:**
- Create: `tests/unit/onboarding-pages.test.ts`

- [ ] Write failing render tests for `/welcome`, `/rules`, `/status`, and `/faq`.
- [ ] Assert presence of required stable product content:
  - lifecycle flow on `/welcome`
  - revocation and controlled access on `/rules`
  - all eight states on `/status`
  - MVP FAQ topics on `/faq`
- [ ] Run the new test file and verify it fails for the current placeholder pages.

## Task 2: Implement the four read-only pages

**Files:**
- Modify: `src/app/welcome/page.tsx`
- Modify: `src/app/rules/page.tsx`
- Modify: `src/app/status/page.tsx`
- Modify: `src/app/faq/page.tsx`

- [ ] Replace `/welcome` with a private-ecosystem overview, a four-step onboarding flow, and a forum-as-source-of-truth section.
- [ ] Replace `/rules` with community rules, controlled access policy, no-open-signup policy, and revocation conditions.
- [ ] Replace `/status` with a scannable state matrix and high-level transition model.
- [ ] Replace `/faq` with real MVP Q&A on entry, UID, activation, membership, decay, Discord mirroring, and revoke.
- [ ] Keep all four pages visually premium, dark, read-only, and within forum-only scope.

## Task 3: Verify the final state

**Files:**
- None

- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Review the resulting pages for scope drift: no new APIs, no staff surface changes, no webhook/Discord contract changes.
