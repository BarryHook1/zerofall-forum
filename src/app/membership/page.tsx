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

export default async function MembershipPage() {
  const session = await requirePathAccess("/membership");
  const overview = await getMemberBillingOverview(session!.user.id);
  const canCheckout = canOpenMembershipCheckout(overview.user.membershipStatus);

  return (
    <SiteShell eyebrow="Private Billing" title="Membership Overview">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Membership State</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">
            {overview.user.membershipStatus}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Plan</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">core_membership</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Expires</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">
            {formatDateTime(overview.user.subscriptionExpiresAt)}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Entry Eligible</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">{overview.user.entryStatus}</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardTitle>Access Policy</CardTitle>
          <CardDescription className="mt-2">
            Recurring membership exists only inside the forum and only after Genesis entry confirmation.
          </CardDescription>
          <div className="mt-6 space-y-3 text-sm text-zinc-300">
            <p>Pricing is intentionally private to the internal surface.</p>
            <p>The forum controls billing, rank, decay, reactivation, and Discord-facing status emission.</p>
            <p>Active standing is derived from successful recurring membership billing inside this application.</p>
          </div>
        </Card>

        <Card>
          <CardTitle>Current Standing</CardTitle>
          <CardDescription className="mt-2">
            Your current billing state determines whether the forum treats you as active, dormant, or decayed.
          </CardDescription>
          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Current Rank</p>
              <div className="mt-3">
                <Badge>{overview.user.rank}</Badge>
              </div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Badge Status</p>
              <p className="mt-3 text-sm text-zinc-200">{overview.user.badgeStatus}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardTitle>Billing Action</CardTitle>
        <CardDescription className="mt-2">
          Membership checkout is available only to valid forum members and stays fully inside the ecosystem.
        </CardDescription>
        <div className="mt-6 flex flex-wrap gap-3">
          {canCheckout ? (
            <form action="/api/membership/checkout" method="post">
              <Button type="submit">{renewalIntentLabel(overview.user.membershipStatus)}</Button>
            </form>
          ) : (
            <Badge>revoked</Badge>
          )}
        </div>
      </Card>
    </SiteShell>
  );
}
