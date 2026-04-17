import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { requirePathAccess } from "@/lib/permissions/guards";
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

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

export default async function BillingPage() {
  const session = await requirePathAccess("/billing");
  const overview = await getMemberBillingOverview(session!.user.id);

  return (
    <SiteShell eyebrow="Private Billing" title="Billing">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Latest Entry</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">
            {overview.latestEntryPurchase?.status ?? "none"}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Subscription</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">
            {overview.activeSubscription?.status ?? "none"}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Membership State</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">
            {overview.user.membershipStatus}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Next Expiry</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">
            {formatDateTime(overview.user.subscriptionExpiresAt)}
          </p>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden">
          <CardTitle>Entry Purchase Ledger</CardTitle>
          <CardDescription className="mt-2">
            Entry purchase confirmation and Genesis admission history owned by the forum.
          </CardDescription>
          <div className="mt-6 overflow-x-auto">
            <Table className="min-w-[760px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-zinc-500">
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Status</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Amount</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Provider</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Paid</th>
                </tr>
              </thead>
              <tbody>
                {overview.user.entryPurchases.map((entry) => (
                  <tr key={entry.id}>
                    <td className="border-b border-white/5 px-4 py-4">
                      <Badge>{entry.status}</Badge>
                    </td>
                    <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                      {formatMoney(entry.amount, entry.currency)}
                    </td>
                    <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                      {entry.provider}
                    </td>
                    <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                      {formatDateTime(entry.paidAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardTitle>Subscription Ledger</CardTitle>
          <CardDescription className="mt-2">
            Recurring membership records tied to this forum account.
          </CardDescription>
          <div className="mt-6 space-y-3">
            {overview.user.subscriptions.map((subscription) => (
              <div key={subscription.id} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{subscription.planCode}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {subscription.providerSubscriptionId}
                    </p>
                  </div>
                  <Badge>{subscription.status}</Badge>
                </div>
                <p className="mt-3 text-xs text-zinc-500">
                  Starts: {formatDateTime(subscription.startsAt)}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Expires: {formatDateTime(subscription.expiresAt)}
                </p>
              </div>
            ))}
            {overview.user.subscriptions.length === 0 ? (
              <p className="text-sm text-zinc-500">No subscription records yet.</p>
            ) : null}
          </div>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <CardTitle>Billing Events</CardTitle>
        <CardDescription className="mt-2">
          Recent forum-side events that changed or explained your billing state.
        </CardDescription>
        <div className="mt-6 overflow-x-auto">
          <Table className="min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.2em] text-zinc-500">
                <th className="border-b border-white/10 px-4 py-3 font-medium">Event</th>
                <th className="border-b border-white/10 px-4 py-3 font-medium">Recorded</th>
              </tr>
            </thead>
            <tbody>
              {overview.user.auditLogs.map((entry) => (
                <tr key={entry.id}>
                  <td className="border-b border-white/5 px-4 py-4 text-zinc-100">
                    {entry.eventType}
                  </td>
                  <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                    {formatDateTime(entry.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>
    </SiteShell>
  );
}
