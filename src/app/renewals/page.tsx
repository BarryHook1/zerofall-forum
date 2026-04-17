import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requirePathAccess } from "@/lib/permissions/guards";
import {
  canOpenMembershipCheckout,
  renewalIntentLabel,
} from "@/lib/billing/presentation";
import { getMemberBillingOverview } from "@/server/queries/member-billing";

function formatDateTime(value: Date | string | null) {
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

export default async function RenewalsPage() {
  const session = await requirePathAccess("/renewals");
  const overview = await getMemberBillingOverview(session!.user.id);
  const canCheckout = canOpenMembershipCheckout(overview.user.membershipStatus);

  return (
    <SiteShell eyebrow="Private Billing" title="Renewals">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Membership</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">
            {overview.user.membershipStatus}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Current Subscription</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">
            {overview.activeSubscription?.status ?? "none"}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Expires</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">
            {formatDateTime(overview.user.subscriptionExpiresAt)}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Rank</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">{overview.user.rank}</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardTitle>Renewal Guidance</CardTitle>
          <CardDescription className="mt-2">
            Active members renew from inside the forum without exposing pricing on the public surface.
          </CardDescription>
          <div className="mt-6 space-y-3 text-sm text-zinc-300">
            <p>Renewal keeps status continuity anchored to the forum source of truth.</p>
            <p>Successful renewal extends subscription validity and preserves active member standing.</p>
            <p>Past-due or expired accounts can still recover through the same internal billing rail.</p>
          </div>
        </Card>

        <Card>
          <CardTitle>Renewal Action</CardTitle>
          <CardDescription className="mt-2">
            This action opens the same internal recurring checkout path already used by the forum.
          </CardDescription>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Badge>{overview.user.membershipStatus}</Badge>
            {canCheckout ? (
              <form action="/api/membership/checkout" method="post">
                <Button type="submit">{renewalIntentLabel(overview.user.membershipStatus)}</Button>
              </form>
            ) : null}
          </div>
        </Card>
      </div>
    </SiteShell>
  );
}
