import Link from "next/link";

import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { renewalIntentLabel } from "@/lib/billing/presentation";
import { requirePathAccess } from "@/lib/permissions/guards";
import { formatForumUid } from "@/lib/formatting/uid";
import { getMemberBillingOverview } from "@/server/queries/member-billing";
import { getMemberStatusOverview } from "@/server/queries/member-status";

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) {
    return "Pending";
  }

  const date = typeof value === "string" ? new Date(value) : value;

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

export default async function DashboardPage() {
  const session = await requirePathAccess("/dashboard");
  const [statusOverview, billingOverview] = await Promise.all([
    getMemberStatusOverview(session!.user.id),
    getMemberBillingOverview(session!.user.id),
  ]);
  const nextBillingAction = renewalIntentLabel(statusOverview.user.membershipStatus);

  return (
    <SiteShell eyebrow="Private Core" title="Dashboard">
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Status</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">
            {session?.user.membershipStatus}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">UID</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">
            {formatForumUid(session?.user.forumUid)}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Rank</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">{session?.user.rank}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Badge</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">
            {session?.user.badgeStatus}
          </p>
        </Card>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Account Standing
              </p>
              <p className="mt-3 text-lg font-medium text-zinc-100">
                Entry: {session?.user.entryStatus}
              </p>
              <p className="mt-2 text-sm text-zinc-400">
                Discord linked: {statusOverview.user.discordId ? "Yes" : "Not linked"}
              </p>
              <p className="mt-2 text-sm text-zinc-400">
                Activation deadline: {formatDateTime(session?.user.activationDeadline)}
              </p>
              <p className="mt-2 text-sm text-zinc-400">
                Subscription expires: {formatDateTime(session?.user.subscriptionExpiresAt)}
              </p>
            </div>
            <Badge>{session?.user.accountRole}</Badge>
          </div>
        </Card>
        <Card>
          <CardTitle>Actions</CardTitle>
          <CardDescription className="mt-2">
            Move through the forum-owned lifecycle surfaces without leaving the private application.
          </CardDescription>
          <div className="mt-5 flex flex-wrap gap-3">
            <form action="/api/membership/checkout" method="post">
              <Button type="submit">{nextBillingAction}</Button>
            </form>
            <Link href="/account-standing">
              <Button variant="ghost">Account Standing</Button>
            </Link>
            <Link href="/billing">
              <Button variant="secondary">Billing Ledger</Button>
            </Link>
            <Link href="/account-standing">
              <Button variant="ghost">
                {statusOverview.user.discordId ? "Manage Discord Link" : "Link Discord"}
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardTitle>Lifecycle Snapshot</CardTitle>
          <CardDescription className="mt-2">
            The forum tracks entry, activation, recurring membership, and prestige as one connected state model.
          </CardDescription>
          <div className="mt-6 space-y-3">
            {statusOverview.milestones.map((milestone) => (
              <div key={milestone.label} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-zinc-200">{milestone.label}</p>
                  <Badge>{milestone.reached ? "reached" : "pending"}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardTitle>Recent Billing Context</CardTitle>
          <CardDescription className="mt-2">
            Latest forum-side billing records relevant to your current status.
          </CardDescription>
          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Latest Entry Purchase</p>
              <p className="mt-3 text-sm text-zinc-200">
                {billingOverview.latestEntryPurchase?.status ?? "none"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Latest Subscription</p>
              <p className="mt-3 text-sm text-zinc-200">
                {billingOverview.activeSubscription?.status ?? "none"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Audit Trail</p>
              <Link href="/account-standing" className="mt-3 inline-block text-sm text-zinc-200">
                Open standing history
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </SiteShell>
  );
}
