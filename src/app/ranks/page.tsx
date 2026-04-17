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

export default async function RanksPage() {
  const session = await requirePathAccess("/ranks");
  const overview = await getMemberStatusOverview(session!.user.id);

  return (
    <SiteShell eyebrow="Status" title="Rank Guide">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Current Rank</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">{overview.user.rank}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Verified</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">
            {overview.rankDistribution.verified}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Elite + Vanguard</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">
            {overview.rankDistribution.elite + overview.rankDistribution.vanguard}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Genesis Founder</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">
            {overview.rankDistribution.genesis_founder}
          </p>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardTitle>Rank Ladder</CardTitle>
          <CardDescription className="mt-2">
            Forum-owned prestige states that later mirror outward to the bot contract.
          </CardDescription>
          <div className="mt-6 space-y-3">
            {overview.rankGuide.map((rank) => (
              <div key={rank.code} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{rank.label}</p>
                    <p className="mt-2 text-sm text-zinc-400">{rank.description}</p>
                  </div>
                  <Badge>{rank.code}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardTitle>Rank History</CardTitle>
          <CardDescription className="mt-2">
            Recorded rank grants and revocations for your account inside the forum ledger.
          </CardDescription>
          <div className="mt-6 overflow-x-auto">
            <Table className="min-w-[520px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-zinc-500">
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Rank</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Granted</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Revoked</th>
                </tr>
              </thead>
              <tbody>
                {overview.user.ranks.map((entry) => (
                  <tr key={entry.id}>
                    <td className="border-b border-white/5 px-4 py-4">
                      <Badge>{entry.rankCode}</Badge>
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
            {overview.user.ranks.length === 0 ? (
              <p className="px-4 py-8 text-sm text-zinc-500">No rank history recorded yet.</p>
            ) : null}
          </div>
        </Card>
      </div>
    </SiteShell>
  );
}
