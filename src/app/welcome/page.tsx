import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requirePathAccess } from "@/lib/permissions/guards";

const flow = [
  {
    step: "Genesis",
    detail:
      "Entry starts with the controlled Genesis path. There is no open public signup that bypasses forum-owned entry.",
  },
  {
    step: "Account Created",
    detail:
      "After confirmed entry, the forum provisions the account, issues the member identity, and records the first controlled state.",
  },
  {
    step: "Activation",
    detail:
      "The member completes activation inside the private forum. This is where the onboarding moves from access granted to access actually enabled.",
  },
  {
    step: "Membership",
    detail:
      "Recurring membership keeps the account in good standing. The forum tracks lifecycle changes and remains the source of truth from here forward.",
  },
] as const;

const pillars = [
  {
    title: "Private ecosystem",
    detail:
      "Zerofall is intentionally not a public community surface. Entry, account creation, activation, and recurring membership all flow through controlled forum-owned steps.",
  },
  {
    title: "Forum source of truth",
    detail:
      "Account state, membership state, UID issuance, and enforcement decisions live in the forum. External surfaces only mirror what the forum has already decided.",
  },
  {
    title: "Read-only orientation",
    detail:
      "This page explains the system so new members understand where they are in the lifecycle without adding any new operational action or side path.",
  },
] as const;

export default async function WelcomePage() {
  await requirePathAccess("/welcome");

  return (
    <SiteShell eyebrow="Entry Area" title="Welcome">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <Badge>Private Ecosystem</Badge>
          <CardTitle className="mt-5 text-3xl">A controlled path into Zerofall.</CardTitle>
          <CardDescription className="mt-4 max-w-2xl text-base text-zinc-300">
            You are entering a private ecosystem designed around controlled entry,
            forum-owned account state, and deliberate access transitions. The
            forum is the source of truth for identity, lifecycle, and membership.
          </CardDescription>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {pillars.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-2xl border border-white/8 bg-black/20 p-4"
              >
                <p className="text-sm font-medium text-zinc-100">{pillar.title}</p>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{pillar.detail}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <Badge>Source of Truth</Badge>
          <CardTitle className="mt-5">Forum first, mirror second.</CardTitle>
          <CardDescription className="mt-4 text-base text-zinc-300">
            Discord may reflect forum state, but it does not define it. The forum
            owns the canonical record for account creation, activation, membership,
            dormancy, decay, and revoke.
          </CardDescription>
          <div className="mt-6 rounded-2xl border border-white/8 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              What happens next
            </p>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              The normal path is simple: Genesis entry confirms access, the forum
              creates the account, activation completes onboarding, and recurring
              membership keeps the account active.
            </p>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {flow.map((item, index) => (
          <Card key={item.step} className="relative overflow-hidden">
            <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-white/30 via-white/10 to-transparent" />
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Step {index + 1}
            </p>
            <CardTitle className="mt-3 text-xl">{item.step}</CardTitle>
            <CardDescription className="mt-4">{item.detail}</CardDescription>
          </Card>
        ))}
      </div>
    </SiteShell>
  );
}
