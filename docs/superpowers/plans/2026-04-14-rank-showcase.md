# Rank Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a premium animated rank progression component below the primary hero CTA on the public Zerofall landing page.

**Architecture:** Build a focused client component that owns the rank data, autoplay state, hover pause behavior, and motion choreography using Framer Motion. Integrate it into the existing public hero without refactoring the rest of the landing page so the visual hierarchy stays stable.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Framer Motion, next/image, Vitest

---

## File Structure Map

- Modify: `/Users/arthurmonteiro/zerofall-forum/package.json`
- Create: `/Users/arthurmonteiro/zerofall-forum/src/components/public/zerofall-rank-showcase.tsx`
- Modify: `/Users/arthurmonteiro/zerofall-forum/src/components/public/hero.tsx`
- Create: `/Users/arthurmonteiro/zerofall-forum/tests/unit/zerofall-rank-showcase.test.ts`

## Task 1: Install motion dependency

**Files:**
- Modify: `/Users/arthurmonteiro/zerofall-forum/package.json`

- [ ] **Step 1: Add Framer Motion**

Run:

```bash
cd /Users/arthurmonteiro/zerofall-forum
npm install framer-motion
```

Expected:

- `package.json` includes `framer-motion`
- lockfile updates cleanly

## Task 2: Build the reusable showcase component

**Files:**
- Create: `/Users/arthurmonteiro/zerofall-forum/src/components/public/zerofall-rank-showcase.tsx`
- Test: `/Users/arthurmonteiro/zerofall-forum/tests/unit/zerofall-rank-showcase.test.ts`

- [ ] **Step 1: Write a focused unit test for rank ordering and defaults**

Test expectations:

- exported rank array has six items in the requested order
- default props do not require callers to pass configuration
- component supports `showLabel={false}`

- [ ] **Step 2: Implement the client component**

Implementation requirements:

- typed rank array with `id`, `name`, `image`, `accent`, `glow`
- `intervalMs`, `pauseOnHover`, `showLabel` props
- autoplay loop
- hover pause and resume
- clickable progress indicators
- `AnimatePresence` for active rank transitions
- subtle float and glow motion
- premium dark Tailwind styling

## Task 3: Integrate into the public hero

**Files:**
- Modify: `/Users/arthurmonteiro/zerofall-forum/src/components/public/hero.tsx`

- [ ] **Step 1: Insert the showcase below the CTA row**

Integration requirements:

- place directly below `Enter Genesis` and `Read Status Model`
- keep headline/copy hierarchy intact
- constrain width so it feels embedded, not like a new section

## Task 4: Verify

**Files:**
- Verify all touched files

- [ ] **Step 1: Run tests**

```bash
cd /Users/arthurmonteiro/zerofall-forum
npm test
```

Expected:

- all existing tests pass
- new showcase test passes

- [ ] **Step 2: Run lint**

```bash
cd /Users/arthurmonteiro/zerofall-forum
npm run lint
```

Expected:

- no lint errors

- [ ] **Step 3: Run production build**

```bash
cd /Users/arthurmonteiro/zerofall-forum
npm run build
```

Expected:

- public landing page builds with the new client component
