import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requirePathAccess } from "@/lib/permissions/guards";
import {
  isReactivationState,
  renewalIntentLabel,
} from "@/lib/billing/presentation";
import { getMemberBillingOverview } from "@/server/queries/member-billing";

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

export default async function ReactivationPage() {
  const session = await requirePathAccess("/reactivation");
  const overview = await getMemberBillingOverview(session!.user.id);
  const needsRecovery = isReactivationState(overview.user.membershipStatus);

  return (
    <SiteShell eyebrow="Lifecycle" title="Reactivation">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Membership</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">
            {overview.user.membershipStatus}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Decay</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">{overview.user.decayState}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Last Expiry</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">
            {formatDateTime(overview.user.subscriptionExpiresAt)}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Current Rank</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">{overview.user.rank}</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardTitle>Recovery Model</CardTitle>
          <CardDescription className="mt-2">
            Dormant and decayed members recover standing by re-entering the recurring billing path inside the forum.
          </CardDescription>
          <div className="mt-6 space-y-3">
            {[
              {
                label: "Subscription expired",
                reached:
                  overview.user.membershipStatus === "dormant" ||
                  overview.user.membershipStatus === "decayed",
              },
              {
                label: "Decay applied if inactivity advanced",
                reached: overview.user.decayState === "decayed",
              },
              {
                label: "Reactivation completes on new successful membership charge",
                reached: overview.user.membershipStatus === "active",
              },
            ].map((step) => (
              <div key={step.label} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-zinc-200">{step.label}</p>
                  <Badge>{step.reached ? "yes" : "not yet"}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>Reactivation Action</CardTitle>
          <CardDescription className="mt-2">
            The forum does not restore status manually from this surface; it restores after successful internal billing.
          </CardDescription>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Eligibility</p>
              <p className="mt-3 text-sm text-zinc-200">
                {needsRecovery
                  ? "This account is eligible for recovery checkout."
                  : "This account does not currently require reactivation."}
              </p>
            </div>
            <form action="/api/membership/checkout" method="post">
              <Button type="submit">{renewalIntentLabel(overview.user.membershipStatus)}</Button>
            </form>
          </div>
        </Card>
      </div>
    </SiteShell>
  );
}
