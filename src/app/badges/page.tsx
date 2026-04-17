import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
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

export default async function BadgesPage() {
  const session = await requirePathAccess("/badges");
  const overview = await getMemberStatusOverview(session!.user.id);

  return (
    <SiteShell eyebrow="Status" title="Badge History">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Badge State</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">
            {overview.user.badgeStatus}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Current Rank</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">{overview.user.rank}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Discord Link</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">
            {overview.user.discordId ? "linked" : "unlinked"}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Milestones Hit</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">
            {overview.milestones.filter((item) => item.reached).length}
          </p>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardTitle>Badge Milestones</CardTitle>
          <CardDescription className="mt-2">
            Forum-visible account milestones that usually coincide with badge availability.
          </CardDescription>
          <div className="mt-6 space-y-3">
            {overview.milestones.map((milestone) => (
              <div key={milestone.label} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-zinc-200">{milestone.label}</p>
                  <Badge>{milestone.reached ? "reached" : "pending"}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardTitle>Badge Ledger</CardTitle>
          <CardDescription className="mt-2">
            Explicit badge records stored by the forum, if any were granted historically.
          </CardDescription>
          <div className="mt-6 overflow-x-auto">
            <Table className="min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-zinc-500">
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Badge</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Status</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Granted</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Revoked</th>
                </tr>
              </thead>
              <tbody>
                {overview.user.badges.map((entry) => (
                  <tr key={entry.id}>
                    <td className="border-b border-white/5 px-4 py-4">
                      <Badge>{entry.badgeCode}</Badge>
                    </td>
                    <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                      {entry.status}
                    </td>
                    <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                      {formatDateTime(entry.grantedAt)}
                    </td>
                    <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                      {formatDateTime(entry.revokedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {overview.user.badges.length === 0 ? (
              <p className="px-4 py-8 text-sm text-zinc-500">
                No explicit badge rows recorded yet. Current badge state still reflects the forum source of truth.
              </p>
            ) : null}
          </div>
        </Card>
      </div>
    </SiteShell>
  );
}
