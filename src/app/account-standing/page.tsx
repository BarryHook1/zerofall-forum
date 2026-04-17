import { DiscordLinkCard } from "@/components/account/discord-link-card";
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

type AccountStandingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AccountStandingPage({
  searchParams,
}: AccountStandingPageProps) {
  const session = await requirePathAccess("/account-standing");
  const overview = await getMemberStatusOverview(session!.user.id);
  const params = searchParams ? await searchParams : undefined;
  const flashCode =
    typeof params?.discord === "string" ? params.discord : null;

  return (
    <SiteShell eyebrow="Lifecycle" title="Account Standing">
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
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Decay</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">{overview.user.decayState}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">UID</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">
            {formatForumUid(overview.user.forumUid)}
          </p>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardTitle>Standing Summary</CardTitle>
          <CardDescription className="mt-2">
            The forum remains the source of truth for access, billing, prestige, and lifecycle state.
          </CardDescription>
          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Activation Deadline</p>
              <p className="mt-3 text-sm text-zinc-200">
                {formatDateTime(overview.user.activationDeadline)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Subscription Expires</p>
              <p className="mt-3 text-sm text-zinc-200">
                {formatDateTime(overview.user.subscriptionExpiresAt)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Discord Link</p>
              <div className="mt-3">
                <Badge>{overview.user.discordId ? "linked" : "unlinked"}</Badge>
              </div>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardTitle>Recent Account Events</CardTitle>
          <CardDescription className="mt-2">
            Latest forum-side events that changed or explained your standing.
          </CardDescription>
          <div className="mt-6 overflow-x-auto">
            <Table className="min-w-[620px] text-sm">
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
      </div>
      <div className="mt-6">
        <DiscordLinkCard
          discordId={overview.user.discordId}
          returnTo="/account-standing"
          flashCode={flashCode}
        />
      </div>
    </SiteShell>
  );
}
