import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { formatForumUid } from "@/lib/formatting/uid";
import { requirePathAccess } from "@/lib/permissions/guards";
import {
  getStaffMembersOverview,
  normalizeMemberSearchQuery,
} from "@/server/queries/staff-members";

import { MemberActionButton } from "../member-action-button";
import { RankActionForm } from "../rank-action-form";

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

export default async function StaffMembersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePathAccess("/staff/members");
  const resolvedSearchParams = await searchParams;
  const query = normalizeMemberSearchQuery(resolvedSearchParams.q);
  const overview = await getStaffMembersOverview(query);

  return (
    <SiteShell eyebrow="Operations" title="Member Operations">
      <Card>
        <CardTitle>Find Member</CardTitle>
        <CardDescription className="mt-2">
          Search by UID, username, or email, then operate rank and account lifecycle from one place.
        </CardDescription>
        <form method="get" className="mt-6 flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            name="q"
            defaultValue={overview.query}
            placeholder="#0001, username, or email"
            className="h-11 flex-1 rounded-full border border-white/10 bg-zinc-950 px-5 text-sm text-zinc-100 outline-none"
          />
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-100 px-5 text-sm font-medium text-zinc-950"
          >
            Search
          </button>
        </form>
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Query</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">
            {overview.query || "Idle"}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Matches</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">{overview.users.length}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Scope</p>
          <p className="mt-3 text-sm font-medium text-zinc-300">
            Rank updates, revoke, and reactivate stay inside forum-owned staff APIs.
          </p>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <CardTitle>Members</CardTitle>
        <CardDescription className="mt-2">
          Current state, rank, and fast actions for matched members.
        </CardDescription>
        <div className="mt-6 overflow-x-auto">
          <Table className="min-w-[1260px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.2em] text-zinc-500">
                <th className="border-b border-white/10 px-4 py-3 font-medium">Member</th>
                <th className="border-b border-white/10 px-4 py-3 font-medium">Status</th>
                <th className="border-b border-white/10 px-4 py-3 font-medium">Rank</th>
                <th className="border-b border-white/10 px-4 py-3 font-medium">Standing</th>
                <th className="border-b border-white/10 px-4 py-3 font-medium">Recent Events</th>
                <th className="border-b border-white/10 px-4 py-3 font-medium text-right">
                  Rank Action
                </th>
                <th className="border-b border-white/10 px-4 py-3 font-medium text-right">
                  Lifecycle
                </th>
              </tr>
            </thead>
            <tbody>
              {overview.users.map((user) => (
                <tr key={user.id} className="align-top">
                  <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                    <p className="font-medium text-zinc-100">{user.username}</p>
                    <p className="mt-1 text-xs text-zinc-500">{user.email}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {formatForumUid(user.forumUid)}
                      {" · "}
                      {user.discordId ?? "No Discord link"}
                    </p>
                  </td>
                  <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                    <p className="text-zinc-100">entry: {user.entryStatus}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      membership: {user.membershipStatus}
                    </p>
                  </td>
                  <td className="border-b border-white/5 px-4 py-4">
                    <Badge>{user.rank}</Badge>
                    <p className="mt-2 text-xs text-zinc-500">
                      Latest grants:{" "}
                      {user.ranks.length > 0
                        ? user.ranks.map((entry) => entry.rankCode).join(", ")
                        : "none"}
                    </p>
                  </td>
                  <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                    <p>badge: {user.badgeStatus}</p>
                    <p className="mt-1 text-xs text-zinc-500">decay: {user.decayState}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      expires: {formatDateTime(user.subscriptionExpiresAt)}
                    </p>
                  </td>
                  <td className="border-b border-white/5 px-4 py-4 text-xs text-zinc-500">
                    <div className="space-y-2">
                      {user.auditLogs.slice(0, 3).map((entry) => (
                        <div key={entry.id}>
                          <p className="text-zinc-300">{entry.eventType}</p>
                          <p>{formatDateTime(entry.createdAt)}</p>
                        </div>
                      ))}
                      {user.auditLogs.length === 0 ? <p>No recent logs</p> : null}
                    </div>
                  </td>
                  <td className="border-b border-white/5 px-4 py-4 text-right">
                    <RankActionForm userId={user.id} currentRank={user.rank} />
                  </td>
                  <td className="border-b border-white/5 px-4 py-4 text-right">
                    <div className="flex flex-col items-end gap-2">
                      {user.membershipStatus === "revoked" ||
                      user.membershipStatus === "dormant" ||
                      user.membershipStatus === "decayed" ? (
                        <MemberActionButton
                          endpoint="/api/staff/reactivate-user"
                          payload={{ userId: user.id }}
                          idleLabel="Reactivate"
                          pendingLabel="Reactivating..."
                          successLabel="Reactivated"
                        />
                      ) : null}
                      {user.membershipStatus !== "revoked" ? (
                        <MemberActionButton
                          endpoint="/api/staff/revoke-user"
                          payload={{ userId: user.id }}
                          idleLabel="Revoke"
                          pendingLabel="Revoking..."
                          successLabel="Revoked"
                          variant="danger"
                        />
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {overview.query && overview.users.length === 0 ? (
            <p className="px-4 py-8 text-sm text-zinc-500">No members matched this search.</p>
          ) : null}
          {!overview.query ? (
            <p className="px-4 py-8 text-sm text-zinc-500">
              Start with a UID, username, or email to load member operations.
            </p>
          ) : null}
        </div>
      </Card>
    </SiteShell>
  );
}
