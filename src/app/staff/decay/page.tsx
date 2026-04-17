import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { formatForumUid } from "@/lib/formatting/uid";
import { requirePathAccess } from "@/lib/permissions/guards";
import { getStaffDecayOverview } from "@/server/queries/staff-decay";

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

export default async function StaffDecayPage() {
  await requirePathAccess("/staff/decay");
  const overview = await getStaffDecayOverview();

  return (
    <SiteShell eyebrow="Operations" title="Decay Log">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Dormant Now</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">{overview.dormantCount}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Decayed Now</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">{overview.decayedCount}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Expired 7d</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">
            {overview.recentExpiredCount}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Decayed 7d</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">
            {overview.recentDecayedCount}
          </p>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <CardTitle>Dormant Members</CardTitle>
          <CardDescription className="mt-2">
            Members whose recurring subscription expired and are still in the grace state.
          </CardDescription>
          <div className="mt-6 overflow-x-auto">
            <Table className="min-w-[760px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-zinc-500">
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Member</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">UID</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Expired</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Decay</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {overview.dormantUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                      <p className="font-medium text-zinc-100">{user.username}</p>
                      <p className="mt-1 text-xs text-zinc-500">{user.email}</p>
                    </td>
                    <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                      {formatForumUid(user.forumUid)}
                    </td>
                    <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                      {formatDateTime(user.subscriptionExpiresAt)}
                    </td>
                    <td className="border-b border-white/5 px-4 py-4">
                      <Badge>{user.decayState}</Badge>
                    </td>
                    <td className="border-b border-white/5 px-4 py-4 text-right">
                      <MemberActionButton
                        endpoint="/api/staff/reactivate-user"
                        payload={{ userId: user.id }}
                        idleLabel="Reactivate"
                        pendingLabel="Reactivating..."
                        successLabel="Reactivated"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardTitle>Decayed Members</CardTitle>
          <CardDescription className="mt-2">
            Members who advanced past dormant and lost higher standing in the forum lifecycle.
          </CardDescription>
          <div className="mt-6 overflow-x-auto">
            <Table className="min-w-[760px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-zinc-500">
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Member</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">UID</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Updated</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">State</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {overview.decayedUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                      <p className="font-medium text-zinc-100">{user.username}</p>
                      <p className="mt-1 text-xs text-zinc-500">{user.email}</p>
                    </td>
                    <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                      {formatForumUid(user.forumUid)}
                    </td>
                    <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                      {formatDateTime(user.updatedAt)}
                    </td>
                    <td className="border-b border-white/5 px-4 py-4">
                      <Badge>{user.decayState}</Badge>
                    </td>
                    <td className="border-b border-white/5 px-4 py-4 text-right">
                      <MemberActionButton
                        endpoint="/api/staff/reactivate-user"
                        payload={{ userId: user.id }}
                        idleLabel="Reactivate"
                        pendingLabel="Reactivating..."
                        successLabel="Reactivated"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <CardTitle>Recent Decay Events</CardTitle>
        <CardDescription className="mt-2">
          Expiration, decay, reactivation, and revoke events tied to lifecycle degradation.
        </CardDescription>
        <div className="mt-6 overflow-x-auto">
          <Table className="min-w-[760px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.2em] text-zinc-500">
                <th className="border-b border-white/10 px-4 py-3 font-medium">Event</th>
                <th className="border-b border-white/10 px-4 py-3 font-medium">Member</th>
                <th className="border-b border-white/10 px-4 py-3 font-medium">Actor</th>
                <th className="border-b border-white/10 px-4 py-3 font-medium">Recorded</th>
              </tr>
            </thead>
            <tbody>
              {overview.recentDecayEvents.map((entry) => (
                <tr key={entry.id}>
                  <td className="border-b border-white/5 px-4 py-4 text-zinc-100">{entry.eventType}</td>
                  <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                    {entry.user?.username ?? "Unknown"}
                    <p className="mt-1 text-xs text-zinc-500">
                      {formatForumUid(entry.user?.forumUid)}
                    </p>
                  </td>
                  <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                    {entry.actor?.username ?? "system"}
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
