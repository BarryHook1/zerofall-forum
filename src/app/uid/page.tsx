import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { formatForumUid } from "@/lib/formatting/uid";
import { requirePathAccess } from "@/lib/permissions/guards";
import { getMemberStatusOverview } from "@/server/queries/member-status";

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

export default async function UidPage() {
  const session = await requirePathAccess("/uid");
  const overview = await getMemberStatusOverview(session!.user.id);

  return (
    <SiteShell eyebrow="Status" title="UID Registry">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Your UID</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">
            {formatForumUid(overview.user.forumUid)}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Entry State</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">{overview.user.entryStatus}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Membership</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">
            {overview.user.membershipStatus}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Issued</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">
            {formatDateTime(overview.user.createdAt)}
          </p>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardTitle>UID Policy</CardTitle>
          <CardDescription className="mt-2">
            UIDs are issued only after paid Genesis entry confirmation, increment sequentially, and are never reused.
          </CardDescription>
          <div className="mt-6 space-y-3 text-sm text-zinc-300">
            <p>Issuance happens after `entry purchase = paid` inside the forum source of truth.</p>
            <p>Display format is `#0001`, while outbound bot payloads use `UID0001`.</p>
            <p>Revoked or decayed accounts do not free a UID back into circulation.</p>
          </div>
        </Card>

        <Card>
          <CardTitle>Registry Position</CardTitle>
          <CardDescription className="mt-2">
            Your UID is part of the permanent ledger of admitted members.
          </CardDescription>
          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Current Rank</p>
              <div className="mt-3">
                <Badge>{overview.user.rank}</Badge>
              </div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Badge State</p>
              <p className="mt-3 text-sm text-zinc-200">{overview.user.badgeStatus}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <CardTitle>Recent UID Registry</CardTitle>
        <CardDescription className="mt-2">
          Latest issued member identities visible inside the private forum surface.
        </CardDescription>
        <div className="mt-6 overflow-x-auto">
          <Table className="min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.2em] text-zinc-500">
                <th className="border-b border-white/10 px-4 py-3 font-medium">UID</th>
                <th className="border-b border-white/10 px-4 py-3 font-medium">Member</th>
                <th className="border-b border-white/10 px-4 py-3 font-medium">Rank</th>
                <th className="border-b border-white/10 px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {overview.recentUidRegistry.map((member) => (
                <tr key={member.id}>
                  <td className="border-b border-white/5 px-4 py-4 text-zinc-100">
                    {formatForumUid(member.forumUid)}
                  </td>
                  <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                    {member.username}
                  </td>
                  <td className="border-b border-white/5 px-4 py-4">
                    <Badge>{member.rank}</Badge>
                  </td>
                  <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                    {formatDateTime(member.createdAt)}
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
