import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { formatForumUid } from "@/lib/formatting/uid";
import { requirePathAccess } from "@/lib/permissions/guards";
import { getStaffActivationsOverview } from "@/server/queries/staff-activations";

import { MemberActionButton } from "../member-action-button";

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

function healthTone(state: string) {
  if (state === "overdue") {
    return "border-red-500/20 bg-red-500/10 text-red-200";
  }

  if (state === "critical") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-200";
  }

  if (state === "healthy") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  }

  return "border-white/10 bg-white/5 text-zinc-300";
}

export default async function StaffActivationsPage() {
  await requirePathAccess("/staff/activations");
  const overview = await getStaffActivationsOverview();

  return (
    <SiteShell eyebrow="Operations" title="Activation Log">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Awaiting</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">{overview.awaitingCount}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Overdue</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">{overview.overdueCount}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Activated</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">{overview.activatedCount}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Revoked</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">{overview.revokedCount}</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card className="overflow-hidden">
          <CardTitle>Awaiting Activation</CardTitle>
          <CardDescription className="mt-2">
            Members created after paid entry who have not yet completed initial activation.
          </CardDescription>
          <div className="mt-6 overflow-x-auto">
            <Table className="min-w-[860px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-zinc-500">
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Member</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">UID</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Deadline</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Health</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Window</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {overview.awaitingUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                      <p className="font-medium text-zinc-100">{user.username}</p>
                      <p className="mt-1 text-xs text-zinc-500">{user.email}</p>
                    </td>
                    <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                      {formatForumUid(user.forumUid)}
                    </td>
                    <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                      {formatDateTime(user.activationDeadline)}
                    </td>
                    <td className="border-b border-white/5 px-4 py-4">
                      <Badge className={healthTone(user.activationHealth)}>
                        {user.activationHealth}
                      </Badge>
                    </td>
                    <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                      {user.activationWindow
                        ? `Created ${formatDateTime(user.activationWindow.createdAt)}`
                        : "No activation window"}
                    </td>
                    <td className="border-b border-white/5 px-4 py-4 text-right">
                      <MemberActionButton
                        endpoint="/api/staff/revoke-user"
                        payload={{ userId: user.id }}
                        idleLabel="Revoke"
                        pendingLabel="Revoking..."
                        successLabel="Revoked"
                        variant="danger"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardTitle>Recent Activation Events</CardTitle>
          <CardDescription className="mt-2">
            Account creation, deadline issuance, activation completion, and revocation activity.
          </CardDescription>
          <div className="mt-6 space-y-3">
            {overview.recentActivationEvents.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{entry.eventType}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {entry.user?.username ?? "Unknown"}
                      {" · "}
                      {formatForumUid(entry.user?.forumUid)}
                    </p>
                  </div>
                  <p className="text-xs text-zinc-500">{formatDateTime(entry.createdAt)}</p>
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  Actor: {entry.actor?.username ?? "system"}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </SiteShell>
  );
}
