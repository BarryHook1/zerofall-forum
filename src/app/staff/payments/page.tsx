import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { formatForumUid } from "@/lib/formatting/uid";
import { requirePathAccess } from "@/lib/permissions/guards";
import { getStaffPaymentsOverview } from "@/server/queries/staff-payments";

function formatDateTime(value: Date | null) {
  if (!value) {
    return "Pending";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(value);
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

export default async function StaffPaymentsPage() {
  await requirePathAccess("/staff/payments");
  const overview = await getStaffPaymentsOverview();

  return (
    <SiteShell eyebrow="Operations" title="Payment Log">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Entry Pending</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">
            {overview.entryStatusCounts.pending}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Entry Paid</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">
            {overview.entryStatusCounts.paid}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Membership Active</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">
            {overview.subscriptionStatusCounts.active}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Membership Expired</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">
            {overview.subscriptionStatusCounts.expired}
          </p>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.25fr_1fr]">
        <Card className="overflow-hidden">
          <CardTitle>Recent Entry Purchases</CardTitle>
          <CardDescription className="mt-2">
            Genesis drop purchases and confirmation state inside the forum source of truth.
          </CardDescription>
          <div className="mt-6 overflow-x-auto">
            <Table className="min-w-[820px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-zinc-500">
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Member</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Status</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Amount</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Provider</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Paid</th>
                </tr>
              </thead>
              <tbody>
                {overview.recentEntryPurchases.map((purchase) => (
                  <tr key={purchase.id}>
                    <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                      <p className="font-medium text-zinc-100">
                        {purchase.user?.username ?? purchase.requestedUsername}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {purchase.email}
                        {" · "}
                        {formatForumUid(purchase.user?.forumUid)}
                      </p>
                    </td>
                    <td className="border-b border-white/5 px-4 py-4">
                      <Badge>{purchase.status}</Badge>
                    </td>
                    <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                      {formatMoney(purchase.amount, purchase.currency)}
                    </td>
                    <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                      <p>{purchase.provider}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {purchase.providerPaymentId ?? "No provider payment id"}
                      </p>
                    </td>
                    <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                      {formatDateTime(purchase.paidAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardTitle>Recent Membership Billing</CardTitle>
          <CardDescription className="mt-2">
            Active and expired recurring subscriptions controlled inside the forum.
          </CardDescription>
          <div className="mt-6 space-y-3">
            {overview.recentSubscriptions.map((subscription) => (
              <div key={subscription.id} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">
                      {subscription.user.username}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {subscription.user.email}
                      {" · "}
                      {formatForumUid(subscription.user.forumUid)}
                    </p>
                  </div>
                  <Badge>{subscription.status}</Badge>
                </div>
                <p className="mt-3 text-sm text-zinc-400">{subscription.planCode}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Expires: {formatDateTime(subscription.expiresAt)}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Member state: {subscription.user.membershipStatus}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <CardTitle>Recent Payment Events</CardTitle>
        <CardDescription className="mt-2">
          Audit trail for confirmed entry payments and membership state changes.
        </CardDescription>
        <div className="mt-6 overflow-x-auto">
          <Table className="min-w-[760px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.2em] text-zinc-500">
                <th className="border-b border-white/10 px-4 py-3 font-medium">Event</th>
                <th className="border-b border-white/10 px-4 py-3 font-medium">Member</th>
                <th className="border-b border-white/10 px-4 py-3 font-medium">Recorded</th>
              </tr>
            </thead>
            <tbody>
              {overview.recentPaymentEvents.map((entry) => (
                <tr key={entry.id}>
                  <td className="border-b border-white/5 px-4 py-4 text-zinc-100">{entry.eventType}</td>
                  <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                    {entry.user?.username ?? "Unknown"}
                    <p className="mt-1 text-xs text-zinc-500">
                      {entry.user?.email ?? "No email"}
                    </p>
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
