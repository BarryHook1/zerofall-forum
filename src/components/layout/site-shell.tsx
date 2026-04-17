import type { PropsWithChildren } from "react";

import Link from "next/link";

import { cn } from "@/lib/utils";

const privateNav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/membership", label: "Membership" },
  { href: "/billing", label: "Billing" },
  { href: "/uid", label: "UID" },
  { href: "/ranks", label: "Ranks" },
  { href: "/badges", label: "Badges" },
];

export function SiteShell({
  children,
  title,
  eyebrow,
  className,
}: PropsWithChildren<{
  title: string;
  eyebrow: string;
  className?: string;
}>) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.07),transparent_28%),linear-gradient(180deg,#0a0a0b_0%,#090909_55%,#050505_100%)] text-zinc-100">
      <header className="border-b border-white/5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5">
          <Link href="/" className="text-sm uppercase tracking-[0.35em] text-zinc-300">
            Zerofall
          </Link>
          <nav className="hidden items-center gap-5 md:flex">
            {privateNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-zinc-400 transition hover:text-zinc-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className={cn("mx-auto max-w-7xl px-6 py-10", className)}>
        <div className="mb-10">
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-zinc-500">{eyebrow}</p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-50">{title}</h1>
        </div>
        {children}
      </main>
    </div>
  );
}
