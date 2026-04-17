import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { formatForumUid } from "@/lib/formatting/uid";
import { requirePathAccess } from "@/lib/permissions/guards";
import { getStaffJobRunsOverview } from "@/server/queries/staff-job-runs";

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

function statusTone(status: string) {
  if (status === "succeeded") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  }

  if (status === "failed") {
    return "border-red-500/20 bg-red-500/10 text-red-200";
  }

  return "border-white/10 bg-white/5 text-zinc-300";
}

export default async function StaffIncidentsPage() {
  await requirePathAccess("/staff/incidents");
  const overview = await getStaffJobRunsOverview();

  return (
    <SiteShell eyebrow="Operations" title="Incident Log">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overview.jobs.map((job) => (
          <Card key={job.jobName}>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{job.jobName}</p>
            <div className="mt-3 flex items-center gap-3">
              <Badge className={statusTone(job.latestRun?.status ?? "unknown")}>
                {job.latestRun?.status ?? "never-run"}
              </Badge>
              <p className="text-sm text-zinc-400">
                {job.latestRun ? `${job.latestRun.processedCount} processed` : "No runs logged"}
              </p>
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              {job.latestRun ? formatDateTime(job.latestRun.finishedAt) : "Pending"}
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card className="overflow-hidden">
          <CardTitle>Recent Job Runs</CardTitle>
          <CardDescription className="mt-2">
            Internal cron and manual job executions recorded by the forum.
          </CardDescription>
          <div className="mt-6 overflow-x-auto">
            <Table className="min-w-[760px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-zinc-500">
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Job</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Status</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Started</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Processed</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Finished</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Error</th>
                </tr>
              </thead>
              <tbody>
                {overview.recentRuns.map((run) => (
                  <tr key={run.id}>
                    <td className="border-b border-white/5 px-4 py-4 text-zinc-100">
                      {run.jobName}
                    </td>
                    <td className="border-b border-white/5 px-4 py-4">
                      <Badge className={statusTone(run.status)}>{run.status}</Badge>
                    </td>
                    <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                      {formatDateTime(run.startedAt)}
                    </td>
                    <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                      {run.processedCount ?? 0}
                    </td>
                    <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                      {formatDateTime(run.finishedAt)}
                    </td>
                    <td className="border-b border-white/5 px-4 py-4 text-xs text-zinc-500">
                      {run.errorSummary ?? "None"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {overview.recentRuns.length === 0 ? (
              <p className="px-4 py-8 text-sm text-zinc-500">No monitored job runs yet.</p>
            ) : null}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardTitle>Recent Operational Events</CardTitle>
          <CardDescription className="mt-2">
            Revokes, lifecycle exceptions, and skipped webhook emissions from the forum.
          </CardDescription>
          <div className="mt-6 space-y-3">
            {overview.incidents.map((entry) => (
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
            {overview.incidents.length === 0 ? (
              <p className="text-sm text-zinc-500">No operational incidents recorded yet.</p>
            ) : null}
          </div>
        </Card>
      </div>
    </SiteShell>
  );
}
