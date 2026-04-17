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

  it("exposes the Zerofall font stack and brand tokens in the app shell", () => {
    const layout = readFileSync(
      resolve(process.cwd(), "src/app/layout.tsx"),
      "utf8",
    );
    const globals = readFileSync(
      resolve(process.cwd(), "src/app/globals.css"),
      "utf8",
    );

    expect(layout).toContain("Sora");
    expect(layout).toContain("Inter");
    expect(layout).toContain("IBM_Plex_Mono");
    expect(layout).toContain(
      "className={`${sora.variable} ${inter.variable} ${ibmPlexMono.variable} h-full antialiased`}",
    );

    expect(globals).toContain("--background: #0a0a0a");
    expect(globals).toContain("--surface: #1e1e1e");
    expect(globals).toContain("--accent: #c0c0c0");
    expect(globals).toContain("--danger: #8b0000");
    expect(globals).toContain("--font-heading: var(--font-sora)");
    expect(globals).toContain("--font-sans: var(--font-inter)");
    expect(globals).toContain("--font-mono: var(--font-ibm-plex-mono)");
    expect(globals).toContain(".surface-grid");
  });

  it("defines shared UI primitives with the Zerofall chrome", () => {
    const button = readFileSync(
      resolve(process.cwd(), "src/components/ui/button.tsx"),
      "utf8",
    );
    const card = readFileSync(
      resolve(process.cwd(), "src/components/ui/card.tsx"),
      "utf8",
    );
    const badge = readFileSync(
      resolve(process.cwd(), "src/components/ui/badge.tsx"),
      "utf8",
    );
    const input = readFileSync(
      resolve(process.cwd(), "src/components/ui/input.tsx"),
      "utf8",
    );
    const table = readFileSync(
      resolve(process.cwd(), "src/components/ui/table.tsx"),
      "utf8",
    );

    expect(button).toContain("font-mono");
    expect(button).toContain("border-line-strong");
    expect(card).toContain("rounded-[1.25rem]");
    expect(card).toContain("bg-surface/75");
    expect(badge).toContain("font-mono");
    expect(badge).toContain("text-accent");
    expect(input).toContain("bg-surface-strong");
    expect(table).toContain("text-sm text-zinc-200");
  });
});
