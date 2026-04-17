# Zerofall Forum Frontend Direction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the forum frontend around the approved `Vault Minimal / Balanced / Soft Frame` direction so Zerofall reads as a private luxury system instead of a generic forum or SaaS shell.

**Architecture:** Start with brand tokens and shared primitives, then apply the new visual grammar to the global shell and high-visibility surfaces. Keep the rollout foundation-first so pages inherit one coherent system instead of accumulating ad hoc restyles.

**Tech Stack:** Next.js App Router, React server components, Tailwind v4 via `@theme`, `next/font/google`, Vitest, server-rendered markup tests

---

## File Structure

### New files

- Create: `.interface-design/system.md`
- Create: `tests/unit/frontend-direction-foundation.test.ts`
- Create: `tests/unit/frontend-direction-pages.test.ts`

### Modify foundation files

- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/card.tsx`
- Modify: `src/components/ui/badge.tsx`
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/table.tsx`
- Modify: `src/components/layout/site-shell.tsx`

### Modify public and member-facing surfaces

- Modify: `src/app/page.tsx`
- Modify: `src/components/public/hero.tsx`
- Modify: `src/components/public/feature-grid.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: `src/components/auth/login-form.tsx`
- Modify: `src/app/genesis/page.tsx`
- Modify: `src/app/membership/page.tsx`
- Modify: `src/app/billing/page.tsx`
- Modify: `src/app/uid/page.tsx`
- Modify: `src/app/ranks/page.tsx`
- Modify: `src/app/badges/page.tsx`
- Modify: `src/app/account-standing/page.tsx`
- Modify: `src/app/renewals/page.tsx`
- Modify: `src/app/welcome/page.tsx`
- Modify: `src/app/rules/page.tsx`
- Modify: `src/app/status/page.tsx`
- Modify: `src/app/faq/page.tsx`

### Existing reference tests

- Reuse: `tests/unit/onboarding-pages.test.ts`
- Reuse: `tests/unit/billing-presentation.test.ts`

---

### Task 1: Save The Approved Design System And Add Foundation Tests

**Files:**
- Create: `.interface-design/system.md`
- Create: `tests/unit/frontend-direction-foundation.test.ts`

- [ ] **Step 1: Write the failing foundation test**

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("frontend direction foundation", () => {
  it("stores the approved interface-design system for Zerofall", () => {
    const system = readFileSync(
      resolve(process.cwd(), ".interface-design/system.md"),
      "utf8",
    );

    expect(system).toContain("Vault Minimal");
    expect(system).toContain("Obsidian Black");
    expect(system).toContain("Titanium Silver");
    expect(system).toContain("Soft Frame");
    expect(system).toContain("Sora");
    expect(system).toContain("Inter");
    expect(system).toContain("IBM Plex Mono");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/frontend-direction-foundation.test.ts`

Expected: FAIL with `ENOENT` because `.interface-design/system.md` does not exist yet.

- [ ] **Step 3: Write the saved design system**

```md
# Zerofall Interface Design System

## Direction

Personality: Vault Minimal
Density: Balanced
Frame: Soft Frame

## Foundation

Primary canvas: Obsidian Black (#0A0A0A)
Secondary surface: Graphite Gray (#1E1E1E)
Accent metal: Titanium Silver (#C0C0C0)
Primary text: Frost White (#F5F5F5)
Rare alert: Deep Crimson (#8B0000)

## Typography

Headings: Sora
UI and body: Inter
Codes and status: IBM Plex Mono

## Depth

Thin metallic borders first
Soft shadows second
No loud glow
No decorative color gradients

## Product rules

Read as a private access terminal, not a public forum
Borrow scanability from classic forums, not their visual identity
Use badges as credentials, not decorative chips
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/frontend-direction-foundation.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .interface-design/system.md tests/unit/frontend-direction-foundation.test.ts
git commit -m "docs: save Zerofall interface design system"
```

---

### Task 2: Move Fonts And Global Tokens To The Zerofall Brand Palette

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Test: `tests/unit/frontend-direction-foundation.test.ts`

- [ ] **Step 1: Extend the failing test with token and font assertions**

```ts
it("exposes the Zerofall font stack and brand tokens in the app shell", async () => {
  const layout = readFileSync(resolve(process.cwd(), "src/app/layout.tsx"), "utf8");
  const globals = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

  expect(layout).toContain("Sora");
  expect(layout).toContain("Inter");
  expect(layout).toContain("IBM_Plex_Mono");

  expect(globals).toContain("--background: #0a0a0a");
  expect(globals).toContain("--surface: #1e1e1e");
  expect(globals).toContain("--accent: #c0c0c0");
  expect(globals).toContain("--danger: #8b0000");
  expect(globals).toContain("--font-sans: var(--font-inter)");
  expect(globals).toContain("--font-mono: var(--font-ibm-plex-mono)");
  expect(globals).toContain(".surface-grid");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/frontend-direction-foundation.test.ts`

Expected: FAIL because `layout.tsx` still imports `Geist` and `globals.css` still uses the old tokens.

- [ ] **Step 3: Update the root layout to the approved type system**

```tsx
import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter, Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Zerofall Forum",
  description: "Private ecosystem core for the Genesis Drop, membership, and Discord sync.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${inter.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground flex flex-col">{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Update the global token layer**

```css
@import "tailwindcss";

:root {
  --background: #0a0a0a;
  --surface: #1e1e1e;
  --surface-strong: #171717;
  --foreground: #f5f5f5;
  --muted: #b0b0b4;
  --line: rgba(192, 192, 192, 0.16);
  --line-strong: rgba(192, 192, 192, 0.24);
  --accent: #c0c0c0;
  --danger: #8b0000;
}

@theme inline {
  --color-background: var(--background);
  --color-surface: var(--surface);
  --color-surface-strong: var(--surface-strong);
  --color-foreground: var(--foreground);
  --color-muted: var(--muted);
  --color-line: var(--line);
  --color-line-strong: var(--line-strong);
  --color-accent: var(--accent);
  --color-danger: var(--danger);
  --font-heading: var(--font-sora);
  --font-sans: var(--font-inter);
  --font-mono: var(--font-ibm-plex-mono);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-inter), sans-serif;
}

.surface-grid {
  background-image:
    linear-gradient(to right, rgba(192, 192, 192, 0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(192, 192, 192, 0.03) 1px, transparent 1px);
  background-size: 48px 48px;
}
```

- [ ] **Step 5: Run the foundation test**

Run: `npm test -- tests/unit/frontend-direction-foundation.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css tests/unit/frontend-direction-foundation.test.ts
git commit -m "feat: add Zerofall font and token foundation"
```

---

### Task 3: Refactor Shared Primitives To Match Vault Minimal

**Files:**
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/card.tsx`
- Modify: `src/components/ui/badge.tsx`
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/table.tsx`
- Test: `tests/unit/frontend-direction-foundation.test.ts`

- [ ] **Step 1: Add failing assertions for primitives**

```ts
it("defines shared UI primitives with the Zerofall chrome", () => {
  const button = readFileSync(resolve(process.cwd(), "src/components/ui/button.tsx"), "utf8");
  const card = readFileSync(resolve(process.cwd(), "src/components/ui/card.tsx"), "utf8");
  const badge = readFileSync(resolve(process.cwd(), "src/components/ui/badge.tsx"), "utf8");
  const input = readFileSync(resolve(process.cwd(), "src/components/ui/input.tsx"), "utf8");
  const table = readFileSync(resolve(process.cwd(), "src/components/ui/table.tsx"), "utf8");

  expect(button).toContain("font-mono");
  expect(button).toContain("border-line-strong");
  expect(card).toContain("rounded-[1.25rem]");
  expect(card).toContain("bg-surface/75");
  expect(badge).toContain("font-mono");
  expect(badge).toContain("text-accent");
  expect(input).toContain("bg-surface-strong");
  expect(table).toContain("text-sm text-zinc-200");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/frontend-direction-foundation.test.ts`

Expected: FAIL on the old primitive classes.

- [ ] **Step 3: Rewrite the button variants around credential-like chrome**

```tsx
const variants = {
  primary:
    "border border-line-strong bg-zinc-950 text-foreground hover:border-accent/60 hover:bg-zinc-900",
  secondary:
    "border border-line bg-surface text-zinc-200 hover:border-line-strong hover:bg-surface-strong",
  ghost:
    "border border-transparent bg-transparent text-zinc-300 hover:border-line hover:bg-white/[0.03]",
  danger:
    "border border-red-900/60 bg-[#160808] text-red-100 hover:bg-[#221010]",
} as const;

className={cn(
  "inline-flex h-11 items-center justify-center rounded-[0.9rem] px-5 font-mono text-[13px] uppercase tracking-[0.18em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:pointer-events-none disabled:opacity-50",
  variants[variant],
  fullWidth && "w-full",
  className,
)}
```

- [ ] **Step 4: Rewrite cards, badges, inputs, and table defaults**

```tsx
// card.tsx
className={cn(
  "rounded-[1.25rem] border border-line bg-surface/75 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-sm",
  className,
)}

// badge.tsx
className={cn(
  "inline-flex items-center rounded-full border border-line-strong bg-black/30 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.24em] text-accent",
  className,
)}

// input.tsx
className={cn(
  "h-12 w-full rounded-[1rem] border border-line bg-surface-strong px-4 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent/25",
  className,
)}

// table.tsx
<table className={cn("w-full border-separate border-spacing-0 text-sm text-zinc-200", className)} {...props}>
```

- [ ] **Step 5: Run the foundation test**

Run: `npm test -- tests/unit/frontend-direction-foundation.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/button.tsx src/components/ui/card.tsx src/components/ui/badge.tsx src/components/ui/input.tsx src/components/ui/table.tsx tests/unit/frontend-direction-foundation.test.ts
git commit -m "feat: restyle shared UI primitives for Zerofall"
```

---

### Task 4: Turn SiteShell Into The Canonical Private-Environment Frame

**Files:**
- Modify: `src/components/layout/site-shell.tsx`
- Modify: `tests/unit/frontend-direction-foundation.test.ts`

- [ ] **Step 1: Add a failing shell test**

```ts
it("uses a restrained private-system shell", () => {
  const shell = readFileSync(resolve(process.cwd(), "src/components/layout/site-shell.tsx"), "utf8");

  expect(shell).toContain("surface-grid");
  expect(shell).toContain("font-mono");
  expect(shell).toContain("border-line");
  expect(shell).toContain("font-heading");
  expect(shell).toContain("ACCESS CONTROLLED");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/frontend-direction-foundation.test.ts`

Expected: FAIL because the current shell does not use the new frame language.

- [ ] **Step 3: Refactor `SiteShell`**

```tsx
return (
  <div className="surface-grid min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_30%),linear-gradient(180deg,#0a0a0a_0%,#080808_55%,#050505_100%)] text-foreground">
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5">
        <div className="flex flex-col">
          <Link href="/" className="font-heading text-sm uppercase tracking-[0.35em] text-zinc-200">
            Zerofall
          </Link>
          <span className="mt-2 font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">
            ACCESS CONTROLLED
          </span>
        </div>
        <nav className="hidden items-center gap-5 md:flex">
          {privateNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-mono text-[12px] uppercase tracking-[0.18em] text-zinc-400 transition hover:text-zinc-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
    <main className={cn("mx-auto max-w-7xl px-6 py-10", className)}>
      <div className="mb-10 border-b border-line pb-6">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">{eyebrow}</p>
        <h1 className="font-heading text-4xl font-semibold tracking-[0.01em] text-foreground">{title}</h1>
      </div>
      {children}
    </main>
  </div>
);
```

- [ ] **Step 4: Run the foundation test**

Run: `npm test -- tests/unit/frontend-direction-foundation.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/site-shell.tsx tests/unit/frontend-direction-foundation.test.ts
git commit -m "feat: restyle site shell for private-system framing"
```

---

### Task 5: Apply The New Grammar To The Public Entry Surface

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/public/hero.tsx`
- Modify: `src/components/public/feature-grid.tsx`
- Create: `tests/unit/frontend-direction-pages.test.ts`

- [ ] **Step 1: Write the failing page test**

```ts
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

describe("frontend direction pages", () => {
  it("renders the home page with Vault Minimal visual language", async () => {
    const { default: HomePage } = await import("@/app/page");
    const html = renderToStaticMarkup(HomePage());

    expect(html).toContain("ACCESS CONTROLLED");
    expect(html).toContain("REQUEST ACCESS");
    expect(html).toContain("font-mono");
    expect(html).toContain("SYSTEM STATUS");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/frontend-direction-pages.test.ts`

Expected: FAIL because the current home page copy and structure do not include the new shell language.

- [ ] **Step 3: Update the home page frame and hero**

```tsx
// page.tsx
<header className="border-b border-line">
  <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
    <div className="flex flex-col">
      <span className="font-heading text-sm uppercase tracking-[0.35em] text-zinc-200">Zerofall</span>
      <span className="mt-2 font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">ACCESS CONTROLLED</span>
    </div>
    <div className="flex items-center gap-3">
      <Link href="/login">
        <Button variant="ghost">Login</Button>
      </Link>
      <Link href="/genesis">
        <Button>Request Access</Button>
      </Link>
    </div>
  </div>
</header>
```

```tsx
// hero.tsx
<p className="mb-4 font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">
  SYSTEM STATUS
</p>
<h1 className="max-w-3xl font-heading text-5xl font-semibold tracking-[0.01em] text-foreground sm:text-6xl">
  Entry is reviewed. Access is controlled.
</h1>
```

```tsx
// feature-grid.tsx
<section className="grid gap-4 md:grid-cols-2">
  {items.map((item, index) => (
    <Card key={item.title} className="relative overflow-hidden">
      <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
        SYS-0{index + 1}
      </div>
      <CardTitle className="font-heading">{item.title}</CardTitle>
      <CardDescription className="mt-3">{item.copy}</CardDescription>
    </Card>
  ))}
</section>
```

- [ ] **Step 4: Run the page test**

Run: `npm test -- tests/unit/frontend-direction-pages.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/components/public/hero.tsx src/components/public/feature-grid.tsx tests/unit/frontend-direction-pages.test.ts
git commit -m "feat: restyle public entry surface"
```

---

### Task 6: Apply The New System To Authentication And Member Entry Pages

**Files:**
- Modify: `src/app/login/page.tsx`
- Modify: `src/components/auth/login-form.tsx`
- Modify: `src/app/genesis/page.tsx`
- Modify: `tests/unit/frontend-direction-pages.test.ts`

- [ ] **Step 1: Extend the page test with login and Genesis assertions**

```ts
it("renders login and Genesis as private-entry surfaces", async () => {
  const { default: LoginPage } = await import("@/app/login/page");
  const { default: GenesisPage } = await import("@/app/genesis/page");

  const loginHtml = renderToStaticMarkup(
    await LoginPage({ searchParams: Promise.resolve({}) }),
  );
  const genesisHtml = renderToStaticMarkup(await GenesisPage());

  expect(loginHtml).toContain("Restricted Access");
  expect(loginHtml).toContain("Private Login");
  expect(loginHtml).toContain("Enter Vault");
  expect(genesisHtml).toContain("ACCESS CONTROLLED");
  expect(genesisHtml).toContain("REQUEST ACCESS");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/frontend-direction-pages.test.ts`

Expected: FAIL because the current login action text is `Enter Forum` and Genesis is not yet aligned to the new system.

- [ ] **Step 3: Update login form and Genesis surface**

```tsx
// login-form.tsx
<Card className="max-w-lg">
  <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
    AUTH NODE
  </div>
  <CardTitle className="font-heading">Private Login</CardTitle>
  <CardDescription className="mt-2">
    Only members created through the Genesis entry flow can authenticate.
  </CardDescription>
  ...
  <Button type="submit" fullWidth disabled={pending}>
    {pending ? "Authenticating..." : "Enter Vault"}
  </Button>
</Card>
```

```tsx
// genesis/page.tsx pattern
<SiteShell eyebrow="Genesis Entry" title="Request Access">
  <Card className="max-w-4xl">
    <Badge>ACCESS CONTROLLED</Badge>
    ...
  </Card>
</SiteShell>
```

- [ ] **Step 4: Run the page test**

Run: `npm test -- tests/unit/frontend-direction-pages.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/login/page.tsx src/components/auth/login-form.tsx src/app/genesis/page.tsx tests/unit/frontend-direction-pages.test.ts
git commit -m "feat: restyle entry and authentication pages"
```

---

### Task 7: Apply The System To Membership, Billing, UID, Ranks, Badges, Standing, And Renewals

**Files:**
- Modify: `src/app/membership/page.tsx`
- Modify: `src/app/billing/page.tsx`
- Modify: `src/app/uid/page.tsx`
- Modify: `src/app/ranks/page.tsx`
- Modify: `src/app/badges/page.tsx`
- Modify: `src/app/account-standing/page.tsx`
- Modify: `src/app/renewals/page.tsx`
- Test: `tests/unit/frontend-direction-pages.test.ts`

- [ ] **Step 1: Add a failing member-surface test**

```ts
it("renders member surfaces with credential-like badges and system labels", async () => {
  const membershipSource = readFileSync(
    resolve(process.cwd(), "src/app/membership/page.tsx"),
    "utf8",
  );
  const uidSource = readFileSync(resolve(process.cwd(), "src/app/uid/page.tsx"), "utf8");
  const ranksSource = readFileSync(resolve(process.cwd(), "src/app/ranks/page.tsx"), "utf8");

  expect(membershipSource).toContain("font-mono");
  expect(membershipSource).toContain("Membership State");
  expect(uidSource).toContain("font-mono");
  expect(ranksSource).toContain("font-heading");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/frontend-direction-pages.test.ts`

Expected: FAIL because these pages still rely on the older generic card language.

- [ ] **Step 3: Apply the shared system to the member surfaces**

```tsx
// membership/page.tsx pattern
<p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
  Membership State
</p>
<p className="mt-3 font-heading text-2xl font-semibold text-zinc-100">
  {overview.user.membershipStatus}
</p>
```

```tsx
// repeated badge/status pattern
<div className="rounded-[1rem] border border-line bg-black/20 p-4">
  <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
    Current Rank
  </p>
  <div className="mt-3">
    <Badge>{overview.user.rank}</Badge>
  </div>
</div>
```

Use the same treatment across:

- billing
- UID
- ranks
- badges
- account standing
- renewals

Do not change business logic, queries, or routes. Only replace the visual grammar.

- [ ] **Step 4: Run the page and domain tests**

Run: `npm test -- tests/unit/frontend-direction-pages.test.ts tests/unit/billing-presentation.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/membership/page.tsx src/app/billing/page.tsx src/app/uid/page.tsx src/app/ranks/page.tsx src/app/badges/page.tsx src/app/account-standing/page.tsx src/app/renewals/page.tsx tests/unit/frontend-direction-pages.test.ts
git commit -m "feat: restyle member account surfaces"
```

---

### Task 8: Align The Informational Pages To The New System

**Files:**
- Modify: `src/app/welcome/page.tsx`
- Modify: `src/app/rules/page.tsx`
- Modify: `src/app/status/page.tsx`
- Modify: `src/app/faq/page.tsx`
- Test: `tests/unit/onboarding-pages.test.ts`
- Test: `tests/unit/frontend-direction-pages.test.ts`

- [ ] **Step 1: Add visual-language assertions for the onboarding pages**

```ts
it("keeps onboarding pages inside the new shell language", () => {
  const welcome = readFileSync(resolve(process.cwd(), "src/app/welcome/page.tsx"), "utf8");
  const rules = readFileSync(resolve(process.cwd(), "src/app/rules/page.tsx"), "utf8");
  const status = readFileSync(resolve(process.cwd(), "src/app/status/page.tsx"), "utf8");
  const faq = readFileSync(resolve(process.cwd(), "src/app/faq/page.tsx"), "utf8");

  expect(welcome).toContain("font-heading");
  expect(rules).toContain("font-mono");
  expect(status).toContain("ACCESS CONTROLLED");
  expect(faq).toContain("font-mono");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/unit/frontend-direction-pages.test.ts tests/unit/onboarding-pages.test.ts`

Expected: FAIL because the pages have the right copy but not the finalized Vault Minimal grammar.

- [ ] **Step 3: Update the informational pages**

```tsx
// recurring pattern for welcome, rules, status, faq
<Badge className="font-mono">ACCESS CONTROLLED</Badge>
<CardTitle className="mt-5 font-heading text-3xl">...</CardTitle>
<p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
  SYS-SECTION
</p>
```

Apply:

- monospace micro-labels
- heading font on primary titles
- reduced decorative blur
- tighter board-like spacing where list content appears

Keep all previously approved copy intact.

- [ ] **Step 4: Run onboarding and frontend tests**

Run: `npm test -- tests/unit/frontend-direction-pages.test.ts tests/unit/onboarding-pages.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/welcome/page.tsx src/app/rules/page.tsx src/app/status/page.tsx src/app/faq/page.tsx tests/unit/frontend-direction-pages.test.ts tests/unit/onboarding-pages.test.ts
git commit -m "feat: align onboarding pages with frontend system"
```

---

### Task 9: Full Verification

**Files:**
- No code changes required

- [ ] **Step 1: Run the focused frontend tests**

Run: `npm test -- tests/unit/frontend-direction-foundation.test.ts tests/unit/frontend-direction-pages.test.ts tests/unit/onboarding-pages.test.ts`

Expected: PASS

- [ ] **Step 2: Run the full test suite**

Run: `npm test`

Expected: PASS with all existing unit and integration tests still green.

- [ ] **Step 3: Run production build**

Run: `npm run build`

Expected: PASS with all static and dynamic routes compiling successfully.

- [ ] **Step 4: Commit verification-only if needed**

```bash
git status --short
```

Expected: no uncommitted verification artifacts.

---

## Self-Review

### Spec coverage

- Zerofall-first identity is covered by Tasks 1-4.
- Foundation-first rollout is covered by the full task order.
- Aimware-informed structure without visual cloning is covered in Tasks 5-8 through shell and scanability changes only.
- Brand palette, typography, badges, and private-system framing are covered by Tasks 2-8.
- No backend, API, or contract changes appear in any task.

### Placeholder scan

- No `TODO`, `TBD`, or “implement later” markers remain.
- Every task has exact file paths.
- Every code step includes concrete code snippets.
- Every validation step includes exact commands and expected outcomes.

### Type consistency

- Font variables are consistent across `layout.tsx` and `globals.css`.
- `font-heading`, `font-sans`, and `font-mono` are introduced once and reused consistently in later tasks.
- Page tests target only visual grammar or copy, not new runtime APIs.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-14-forum-frontend-direction.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**

