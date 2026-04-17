import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requirePathAccess } from "@/lib/permissions/guards";
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

export default async function ActivationPage() {
  const session = await requirePathAccess("/activation");
  const overview = await getMemberBillingOverview(session!.user.id);
  const isAwaitingActivation = overview.user.membershipStatus === "awaiting_activation";

  return (
    <SiteShell eyebrow="Entry Area" title="Activation">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Entry</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">{overview.user.entryStatus}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Membership</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">
            {overview.user.membershipStatus}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Deadline</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">
            {formatDateTime(overview.user.activationDeadline)}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Discord Link</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">
            {overview.user.discordId ? "linked" : "unlinked"}
          </p>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardTitle>Activation Steps</CardTitle>
          <CardDescription className="mt-2">
            Initial activation is completed by purchasing the recurring membership inside the forum.
          </CardDescription>
          <div className="mt-6 space-y-3">
            {[
              {
                label: "Genesis entry paid",
                reached: overview.user.entryStatus === "entry_confirmed",
              },
              {
                label: "Account provisioned",
                reached: Boolean(overview.user.forumUid),
              },
              {
                label: "Membership activated",
                reached: overview.user.membershipStatus === "active",
              },
            ].map((step) => (
              <div key={step.label} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-zinc-200">{step.label}</p>
                  <Badge>{step.reached ? "complete" : "pending"}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>Activation Action</CardTitle>
          <CardDescription className="mt-2">
            If you remain in awaiting activation past the deadline, the forum can revoke the account.
          </CardDescription>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Current State</p>
              <p className="mt-3 text-sm text-zinc-200">
                {isAwaitingActivation
                  ? "Activation is still pending and time-bound."
                  : "Activation is already complete or no longer pending."}
              </p>
            </div>
            <form action="/api/membership/checkout" method="post">
              <Button type="submit">
                {isAwaitingActivation ? "Activate Membership" : "Open Membership Checkout"}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </SiteShell>
  );
}
