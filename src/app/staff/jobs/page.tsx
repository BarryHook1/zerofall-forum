import type { JobRunStatus } from "@prisma/client";

import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { formatForumUid } from "@/lib/formatting/uid";
import { requirePathAccess } from "@/lib/permissions/guards";
import { getStaffJobRunsOverview } from "@/server/queries/staff-job-runs";

function formatDateTime(value: Date | null) {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(value);
}

function statusTone(status: JobRunStatus | null) {
  if (status === "succeeded") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  }

  if (status === "failed") {
    return "border-red-500/20 bg-red-500/10 text-red-200";
  }

  if (status === "running") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-200";
  }

  return "border-white/10 bg-white/5 text-zinc-300";
}

function configTone(status: "ready" | "warning" | "missing") {
  if (status === "ready") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  }

  if (status === "warning") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-200";
  }

  return "border-red-500/20 bg-red-500/10 text-red-200";
}

export default async function StaffJobsPage() {
  await requirePathAccess("/staff/jobs");
  const overview = await getStaffJobRunsOverview();

  return (
    <SiteShell eyebrow="Operations" title="Forum Jobs">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overview.jobs.map(({ jobName, latestRun }) => (
          <Card key={jobName}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{jobName}</p>
                <p className="mt-3 text-sm font-medium text-zinc-100">
                  Last run: {formatDateTime(latestRun?.startedAt ?? null)}
                </p>
                <p className="mt-2 text-sm text-zinc-400">
                  Processed: {latestRun?.processedCount ?? 0}
                </p>
              </div>
              <Badge className={statusTone(latestRun?.status ?? null)}>
                {latestRun?.status ?? "never"}
              </Badge>
            </div>
            <p className="mt-4 text-sm text-zinc-400">
              {latestRun?.errorSummary ?? "No recent error summary."}
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardTitle>Environment Health</CardTitle>
          <CardDescription className="mt-2">
            Forum-side config checks for auth, Discord boundary, billing, and scheduled operations.
          </CardDescription>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Ready</p>
              <p className="mt-3 text-2xl font-semibold text-zinc-100">
                {overview.config.counts.ready}
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Warnings</p>
              <p className="mt-3 text-2xl font-semibold text-zinc-100">
                {overview.config.counts.warning}
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Missing</p>
              <p className="mt-3 text-2xl font-semibold text-zinc-100">
                {overview.config.counts.missing}
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              Discord OAuth Callback
            </p>
            <p className="mt-3 text-sm text-zinc-200">
              {overview.config.discordCallbackUrl ?? "Unavailable until NEXTAUTH_URL or AUTH_URL is set"}
            </p>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardTitle>Config Checks</CardTitle>
          <CardDescription className="mt-2">
            Presence and canonical shape of the env required to run the forum safely.
          </CardDescription>
          <div className="mt-6 space-y-3">
            {overview.config.checks.map((check) => (
              <div
                key={check.key}
                className="rounded-2xl border border-white/8 bg-black/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{check.label}</p>
                    <p className="mt-2 text-sm text-zinc-400">{check.detail}</p>
                  </div>
                  <Badge className={configTone(check.status)}>{check.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden">
          <CardTitle>Recent Job Runs</CardTitle>
          <CardDescription className="mt-2">
            Latest execution history for forum-owned internal jobs.
          </CardDescription>
          <div className="mt-6 overflow-x-auto">
            <Table className="min-w-[760px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-zinc-500">
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Job</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Status</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Started</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Finished</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Processed</th>
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
                      {formatDateTime(run.finishedAt)}
                    </td>
                    <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                      {run.processedCount ?? 0}
                    </td>
                    <td className="border-b border-white/5 px-4 py-4 text-xs text-zinc-500">
                      {run.errorSummary ?? "None"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {overview.recentRuns.length === 0 ? (
              <p className="px-4 py-8 text-sm text-zinc-500">No job runs recorded yet.</p>
            ) : null}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardTitle>Related Incidents</CardTitle>
          <CardDescription className="mt-2">
            Adjacent forum events that usually explain why a job changed member state.
          </CardDescription>
          <div className="mt-6 space-y-3">
            {overview.incidents.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-white/8 bg-black/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{entry.eventType}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {entry.user?.username ?? "Unknown member"}
                      {" · "}
                      {formatForumUid(entry.user?.forumUid)}
                    </p>
                  </div>
                  <p className="text-xs text-zinc-500">{formatDateTime(entry.createdAt)}</p>
                </div>
                <p className="mt-3 text-sm text-zinc-400">
                  Actor: {entry.actor?.username ?? "system"}
                </p>
              </div>
            ))}
            {overview.incidents.length === 0 ? (
              <p className="text-sm text-zinc-500">No recent related incidents.</p>
            ) : null}
          </div>
        </Card>
      </div>
    </SiteShell>
  );
}
