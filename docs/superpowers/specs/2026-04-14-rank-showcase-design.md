# Zerofall Rank Showcase Design

## Objective

Build a premium animated rank progression component for the public hero section of the Zerofall forum.

The component should reinforce a restricted, premium, forum-owned rank system rather than feel like a game or esports interface.

## Placement

The rank showcase will sit directly below the primary CTA block in the public hero.

This means:

- the current hero copy remains the first thing the user reads
- the `Enter Genesis` CTA remains primary
- the rank showcase becomes a controlled visual reveal beneath the entry action
- the existing right-side informational card can remain unchanged for now

## Component Shape

Create a reusable client component:

- `src/components/public/zerofall-rank-showcase.tsx`

Public API:

- `intervalMs?: number`
- `pauseOnHover?: boolean`
- `showLabel?: boolean`

The component owns:

- the typed rank definition array
- autoplay timing
- hover pause behavior
- manual progress selection
- Framer Motion transitions

## Rank Data Model

Use a typed rank array with:

- `id`
- `name`
- `image`
- `accent`
- `glow`

Ranks in order:

1. Core
2. Verified
3. Elite
4. Vanguard
5. Zero Crown
6. Genesis Founder

Image sources:

- `/ranks/core.png`
- `/ranks/verified.png`
- `/ranks/elite.png`
- `/ranks/vanguard.png`
- `/ranks/zero-crown.png`
- `/ranks/genesis-founder.png`

## Motion Design

Only one emblem is visible at a time.

Behavior:

- autoplay every `2200ms`
- infinite loop
- hover pauses autoplay when enabled
- hover leave resumes autoplay
- progress indicators allow instant manual jump

Animation language:

- entry: fade in + slight scale up
- exit: fade out + slight scale down
- active emblem: slow floating vertical motion
- glow: soft breathing pulse behind emblem

The motion should feel quiet, controlled, and cinematic rather than flashy.

## Visual Design

The component should feel like part of a classified luxury system.

Styling direction:

- deep obsidian black base
- thin border
- restrained internal gradient
- soft glow halo behind emblem using each rank accent
- clean spacing
- centered composition
- refined indicator row below the label

Avoid:

- neon glow
- arcade lighting
- gamer UI framing
- loud particle effects
- oversized chrome

## Hero Integration

Update:

- `src/components/public/hero.tsx`

Plan:

- keep headline and body copy as-is
- keep CTA row as-is
- insert `ZerofallRankShowcase` immediately below the CTA row
- constrain width so it reads as a premium embedded system element, not a section break

## Technical Notes

- add `framer-motion` dependency
- implement as a client component
- use `AnimatePresence` for active rank switching
- use `next/image` for emblem rendering
- keep rank definitions exported or easy to edit later

## Validation

Implementation is complete when:

- the component renders inside the public hero under the CTA
- autoplay loops through all six ranks
- hover pause works
- manual indicator jump works
- transitions are smooth
- the result visually matches the forum's premium dark direction
- `npm test`
- `npm run build`
- `npm run lint`
