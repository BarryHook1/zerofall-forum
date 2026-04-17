## Zerofall Forum Frontend Direction

Date: 2026-04-14

### Objective

Define the visual and structural direction for the Zerofall forum frontend using:

- Zerofall brand documents as the source of truth for identity
- `aimware.net` as a limited reference for forum information architecture and scanability

This is a frontend design direction only. It does not introduce new product behavior, new integrations, or operational workflows.

### Inputs Reviewed

Brand references:

- `Desktop/ZERO FALL/IDENTIDADE VISUAL.docx`
- `Desktop/ZERO FALL/BRAND STYLE SYSTEM.docx`
- `Desktop/ZERO FALL/ZERØFALL — DASHBOARD UI MOCKUP CONCEPT.docx`
- `Desktop/ZERO FALL/ZEROFALL.docx`

Reference surface:

- `Downloads/saveweb2zip-com-aimware-net/index.html`

Current forum surfaces reviewed:

- `src/app/page.tsx`
- `src/app/globals.css`
- `src/components/layout/site-shell.tsx`
- `src/components/public/hero.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`

### Core Decision

The frontend should **not** imitate `aimware.net` as a visual identity.

The correct model is:

- **Zerofall-first identity**
- **aimware-informed structure**

Meaning:

- Zerofall owns the atmosphere, materials, typography, status language, and interaction tone
- aimware only informs density, hierarchy, board/category readability, and forum scanability

### Why This Is The Right Decision

The Zerofall brand documents are unusually consistent. They repeatedly define the product as:

- `classified luxury system`
- `elite gatekeeper system`
- `private vault control system`
- `premium silent technology`
- `restricted, closed, controlled access`

They explicitly reject:

- gamer aesthetics
- neon / RGB
- exaggerated cyberpunk
- loud glow or colorful gradients

They explicitly point toward:

- Apple minimalism
- stealth military systems
- private vault interfaces
- Tesla internal UI
- Stripe-like dashboard discipline

`aimware.net` is valuable because it demonstrates:

- strong board/category hierarchy
- dense, readable forum organization
- clear utility placement
- effective forum scanability

But its visual language signals:

- legacy public software forum
- community portal chrome
- a less premium and less private atmosphere

That conflicts with Zerofall's stated identity.

### Chosen Direction

## Vault Minimal / Balanced / Soft Frame

This direction should govern the forum frontend.

#### Vault Minimal

The interface should feel rare, quiet, sealed, and premium.

It should read as:

- a private member environment
- an access-controlled system
- a minimal luxury console

It should not read as:

- a loud hacker interface
- a mass-market SaaS dashboard
- a public gaming forum

#### Balanced

The interface should keep enough density to function as a real forum, but without collapsing into legacy forum heaviness.

That means:

- readable information blocks
- moderate density
- deliberate hierarchy
- enough whitespace to preserve calm and status

#### Soft Frame

Chrome should exist, but quietly.

Hierarchy should come mostly from:

- typography
- spacing
- thin separators
- small elevation shifts

Not from:

- thick bars
- heavy boxes
- loud panel treatment

### Brand Translation

## Intent

The user should feel:

- admitted into something private
- observed by a controlled system
- guided through a reserved environment

The user should not feel:

- entertained
- dazzled
- dropped into a generic social or community portal

## Domain Concepts

The design language should reflect:

- vault
- credential
- access control
- internal panel
- restricted membership
- quiet authority

## Color World

Use the official brand palette as the primary system:

- Obsidian Black `#0A0A0A` for the dominant canvas
- Graphite Gray `#1E1E1E` for panels and containers
- Titanium Silver `#C0C0C0` for thin lines, premium accents, controlled highlights
- Frost White `#F5F5F5` for primary text
- Deep / Dark Crimson `#8B0000` for rare alerts, revoke states, and exceptional emphasis

Rules:

- no saturated decorative accents
- no colorful gradients
- no RGB or neon treatment
- silver is structural, not flashy

## Materials

The UI should feel made of:

- matte black
- brushed titanium
- smoked glass
- subtle technical grid

Not:

- glossy plastic
- bright gradients
- soft playful consumer surfaces

## Typography

Recommended hierarchy:

- Headings: `Sora` or `Space Grotesk`
- UI text and body: `Inter`
- UID, codes, status labels: `IBM Plex Mono` or `Space Mono`

Rules:

- system labels may use uppercase sparingly
- headings should feel cold and controlled, not decorative
- monospace should be used as identity, not just utility

### What To Borrow From Aimware

Borrow:

- board/category grouping discipline
- row-based scanability for forum structures
- visible but efficient metadata placement
- strong breadcrumbs and wayfinding
- utility-first layout logic

Do not borrow:

- legacy community portal chrome
- public-forum energy
- bootstrap-like component feel
- noisy or dated navigation framing
- visual language detached from Zerofall branding

### UI Grammar

## Canvas

- dark-only
- subtle radial and linear depth is acceptable, but restrained
- optional stealth grid at very low contrast

## Borders and Depth

- primary depth method: thin metallic borders + soft shadow support
- shadow should support shape, not define hierarchy alone
- separators should be visible only when needed

## Radius

- moderate radius
- avoid overly pill-like or soft consumer rounding
- components should feel machined, not playful

## Buttons

Primary:

- black fill or near-black fill
- titanium border or titanium accent treatment
- hover should brighten gently, never glow loudly

Secondary:

- graphite surface
- low-contrast border
- text-driven hierarchy

## Cards

- quieter than the current oversized soft cards
- more structured and panel-like
- subtle internal hierarchy
- less decorative blur

## Badges

Badges are a major identity surface.

They should feel like:

- issued credentials
- rank tabs
- system labels

They should not feel like:

- decorative chips
- playful tags

UID, rank, status, and access standing should become visually distinctive parts of the product language.

### Structural Translation

## Header

The global header should become:

- quieter
- more premium
- more aligned to a private system shell

It should include:

- restrained wordmark presence
- compact navigation
- precise action placement

It should avoid:

- landing-page hero energy
- over-prominent CTA treatment on every surface

## Site Shell

`SiteShell` should become the canonical private-environment frame.

It should provide:

- consistent page chrome
- restrained top framing
- typography-led hierarchy
- reusable page title and eyebrow treatment

## Forum Index And Board Views

These should take the most structural influence from `aimware`.

Goals:

- category blocks that scan quickly
- board rows with strong alignment
- metadata columns that feel deliberate
- quieter surfaces than classic forum portals

The result should feel closer to:

- internal directory
- access console

than to:

- open community board

## Public And Member Pages

Pages such as:

- `/`
- `/login`
- `/genesis`
- `/membership`
- `/billing`
- `/uid`
- `/ranks`
- `/badges`
- `/welcome`
- `/rules`
- `/status`
- `/faq`

should all inherit the same grammar so the product feels like one private environment rather than separate microsites.

### Rollout Strategy

## Recommended Approach: Foundation-First

Do not redesign page-by-page first.

Start by rebuilding the visual grammar:

1. `globals.css`
2. `Button`
3. `Card`
4. `Badge`
5. `SiteShell`
6. shared public hero / section primitives where needed

Then apply that system to the most visible public/member surfaces.

After the foundations are stable, redesign the actual forum-heavy screens using the new primitives.

### Why Foundation-First

- prevents visual drift
- avoids redoing multiple pages after token changes
- lets the product converge on one language quickly
- reduces the risk of one standout page with inconsistent primitives underneath

### Success Criteria

The redesign is successful when the forum frontend feels:

- clearly Zerofall
- private and controlled
- premium but restrained
- structurally readable like a serious forum
- consistent across public and member-facing surfaces

It is unsuccessful if it looks:

- like a direct aimware clone
- like a generic modern SaaS theme
- like a gamer/cyberpunk dashboard
- like mixed visual systems glued together

### Explicit Non-Goals

- no new backend or API behavior
- no bot contract changes
- no new operational workflows
- no Discord-state assumptions
- no aesthetic move toward neon, esports, hacker, or RGB language

