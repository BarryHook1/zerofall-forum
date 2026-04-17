import Link from "next/link";

import { ZerofallRankShowcase } from "@/components/public/zerofall-rank-showcase";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
      <div>
        <p className="mb-4 text-xs uppercase tracking-[0.35em] text-zinc-500">
          Controlled Entry
        </p>
        <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-zinc-50 sm:text-6xl">
          The Genesis Drop is the only way in.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
          Zerofall is a private ecosystem with controlled access. Entry grants account
          creation, sequential UID issuance, and the right to activate internal membership
          from inside the forum.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/genesis">
            <Button>Enter Genesis</Button>
          </Link>
          <Link href="/status">
            <Button variant="ghost">Read Status Model</Button>
          </Link>
        </div>
        <ZerofallRankShowcase />
      </div>
      <div className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-6 shadow-2xl shadow-black/40">
        <div className="space-y-6">
          {[
            ["Entry", "Stripe entry payment confirms access eligibility."],
            ["Provisioning", "Account and UID are created only after payment confirmation."],
            ["Activation", "Membership activation happens inside the private forum only."],
            ["Discord", "Roles mirror forum state. The forum remains the source of truth."],
          ].map(([title, copy]) => (
            <div key={title} className="border-b border-white/5 pb-5 last:border-b-0 last:pb-0">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">{title}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
