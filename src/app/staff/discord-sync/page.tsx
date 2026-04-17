import type { WebhookDeliveryStatus } from "@prisma/client";
import type { ReactNode } from "react";

import Link from "next/link";

import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { formatForumUid } from "@/lib/formatting/uid";
import { requirePathAccess } from "@/lib/permissions/guards";
import { getStaffDiscordSyncOverview } from "@/server/queries/staff-discord-sync";

import { RequeueFailedWebhooksButton } from "./requeue-failed-webhooks-button";
import { RequeueWebhookButton } from "./requeue-webhook-button";

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

function statusTone(status: WebhookDeliveryStatus) {
  if (status === "succeeded") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  }

  if (status === "failed") {
    return "border-red-500/20 bg-red-500/10 text-red-200";
  }

  if (status === "processing") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-200";
  }

  return "border-white/10 bg-white/5 text-zinc-300";
}

function buildPageHref(
  searchParams: Record<string, string | string[] | undefined>,
  page: number,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (!value) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        params.append(key, entry);
      }
      continue;
    }

    params.set(key, value);
  }

  params.set("page", String(page));
  return `/staff/discord-sync?${params.toString()}`;
}

function MetricCard({
  label,
  value,
  action,
}: {
  label: string;
  value: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-100">{value}</p>
        </div>
        {action}
      </div>
    </Card>
  );
}

export default async function StaffDiscordSyncPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePathAccess("/staff/discord-sync");
  const resolvedSearchParams = await searchParams;
  const overview = await getStaffDiscordSyncOverview(resolvedSearchParams);

  return (
    <SiteShell eyebrow="Operations" title="Discord Sync Log">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Pending" value={overview.counts.pending} />
        <MetricCard label="Processing" value={overview.counts.processing} />
        <MetricCard label="Failed" value={overview.counts.failed} />
        <MetricCard label="Succeeded" value={overview.counts.succeeded} />
        <MetricCard label="Skipped" value={overview.counts.skipped} />
        <MetricCard label="Queued" value={overview.counts.queued} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Recent Failures</CardTitle>
              <CardDescription className="mt-2">
                Last failed deliveries recorded by the forum outbox.
              </CardDescription>
            </div>
            <Badge className="border-red-500/20 bg-red-500/10 text-red-200">
              {overview.recentFailures.length}
            </Badge>
          </div>
          <div className="mt-5 space-y-3">
            {overview.recentFailures.map((delivery) => (
              <div
                key={delivery.id}
                className="rounded-2xl border border-white/8 bg-black/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{delivery.eventName}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {delivery.user?.username ?? "Unknown member"}
                      {" · "}
                      {formatForumUid(delivery.user?.forumUid)}
                    </p>
                  </div>
                  <p className="text-xs text-zinc-500">
                    {formatDateTime(delivery.lastAttemptAt)}
                  </p>
                </div>
                <p className="mt-3 text-sm text-zinc-400">
                  {delivery.lastError ?? "Unknown delivery error"}
                </p>
              </div>
            ))}
            {overview.recentFailures.length === 0 ? (
              <p className="text-sm text-zinc-500">No recent failed deliveries.</p>
            ) : null}
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Stuck Retries</CardTitle>
              <CardDescription className="mt-2">
                Failed retries that are already overdue or deliveries stuck in processing.
              </CardDescription>
            </div>
            <RequeueFailedWebhooksButton disabled={overview.counts.failed === 0} />
          </div>
          <div className="mt-5 space-y-3">
            {overview.stuckRetries.map((delivery) => (
              <div
                key={delivery.id}
                className="rounded-2xl border border-white/8 bg-black/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{delivery.eventName}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {delivery.user?.username ?? "Unknown member"}
                      {" · "}
                      {formatForumUid(delivery.user?.forumUid)}
                    </p>
                  </div>
                  <Badge className={statusTone(delivery.status)}>{delivery.status}</Badge>
                </div>
                <p className="mt-3 text-sm text-zinc-400">
                  Attempts: {delivery.attemptCount}
                  {" · "}
                  Next retry: {formatDateTime(delivery.nextAttemptAt)}
                </p>
              </div>
            ))}
            {overview.stuckRetries.length === 0 ? (
              <p className="text-sm text-zinc-500">No stuck retries detected.</p>
            ) : null}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-4">
            <div>
              <CardTitle>Webhook Deliveries</CardTitle>
              <CardDescription className="mt-2">
                Canonical forum-to-bot deliveries, filtered and paginated on the forum side.
              </CardDescription>
            </div>
            <form method="get" className="grid gap-3 md:grid-cols-4">
              <label className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                <span className="mb-2 block">Status</span>
                <select
                  name="status"
                  defaultValue={overview.filters.status === "all" ? "" : overview.filters.status}
                  className="h-11 w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 text-sm text-zinc-100 outline-none"
                >
                  <option value="">All</option>
                  {overview.filterOptions.statuses
                    .filter((status) => status !== "all")
                    .map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                </select>
              </label>

              <label className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                <span className="mb-2 block">Event</span>
                <select
                  name="eventName"
                  defaultValue={overview.filters.eventName ?? ""}
                  className="h-11 w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 text-sm text-zinc-100 outline-none"
                >
                  <option value="">All</option>
                  {overview.filterOptions.eventNames.map((eventName) => (
                    <option key={eventName} value={eventName}>
                      {eventName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                <span className="mb-2 block">Has Error</span>
                <select
                  name="hasError"
                  defaultValue={
                    overview.filters.hasError === null
                      ? ""
                      : overview.filters.hasError
                        ? "true"
                        : "false"
                  }
                  className="h-11 w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 text-sm text-zinc-100 outline-none"
                >
                  <option value="">All</option>
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              </label>

              <label className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                <span className="mb-2 block">Skip Reason</span>
                <select
                  name="skipReason"
                  defaultValue={overview.filters.skipReason ?? ""}
                  className="h-11 w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 text-sm text-zinc-100 outline-none"
                >
                  <option value="">All</option>
                  {overview.filterOptions.skippedReasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </label>

              <input type="hidden" name="page" value="1" />

              <div className="md:col-span-4 flex gap-3">
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-100 px-5 text-sm font-medium text-zinc-950"
                >
                  Apply Filters
                </button>
                <Link
                  href="/staff/discord-sync"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 px-5 text-sm text-zinc-300"
                >
                  Clear
                </Link>
              </div>
            </form>
          </div>

          <div className="mt-6 overflow-x-auto">
            <Table className="min-w-[980px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-zinc-500">
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Member</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Event</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Status</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Attempts</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Next Retry</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Processed</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium">Error</th>
                  <th className="border-b border-white/10 px-4 py-3 font-medium text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {overview.deliveries.map((delivery) => (
                  <tr key={delivery.id} className="align-top">
                    <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                      <p className="font-medium text-zinc-100">
                        {delivery.user?.username ?? "Unlinked record"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {delivery.user?.email ?? "No email"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {formatForumUid(delivery.user?.forumUid)}
                        {" · "}
                        {delivery.user?.discordId ?? "No Discord link"}
                      </p>
                    </td>
                    <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                      <p className="font-medium text-zinc-100">{delivery.eventName}</p>
                      <p className="mt-1 break-all text-xs text-zinc-500">
                        {delivery.deliveryId}
                      </p>
                    </td>
                    <td className="border-b border-white/5 px-4 py-4">
                      <Badge className={statusTone(delivery.status)}>{delivery.status}</Badge>
                    </td>
                    <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                      {delivery.attemptCount}
                    </td>
                    <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                      {formatDateTime(delivery.nextAttemptAt)}
                    </td>
                    <td className="border-b border-white/5 px-4 py-4 text-zinc-300">
                      {formatDateTime(delivery.processedAt)}
                    </td>
                    <td className="border-b border-white/5 px-4 py-4 text-xs text-zinc-500">
                      {delivery.lastError ?? "None"}
                    </td>
                    <td className="border-b border-white/5 px-4 py-4 text-right">
                      <RequeueWebhookButton
                        deliveryId={delivery.deliveryId}
                        disabled={delivery.status === "processing"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {overview.deliveries.length === 0 ? (
              <p className="px-4 py-8 text-sm text-zinc-500">
                No webhook deliveries match the current filters.
              </p>
            ) : null}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4 text-sm text-zinc-500">
            <p>
              Page {overview.pagination.page} of {overview.pagination.totalPages}
              {" · "}
              {overview.pagination.totalResults} matching deliveries
            </p>
            <div className="flex gap-3">
              {overview.pagination.hasPreviousPage ? (
                <Link
                  href={buildPageHref(resolvedSearchParams, overview.pagination.page - 1)}
                  className="rounded-full border border-white/10 px-4 py-2 text-zinc-300"
                >
                  Previous
                </Link>
              ) : null}
              {overview.pagination.hasNextPage ? (
                <Link
                  href={buildPageHref(resolvedSearchParams, overview.pagination.page + 1)}
                  className="rounded-full border border-white/10 px-4 py-2 text-zinc-300"
                >
                  Next
                </Link>
              ) : null}
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardTitle>Queue Audit Trail</CardTitle>
          <CardDescription className="mt-2">
            Skips and queue operations recorded on the forum before the bot sees anything.
          </CardDescription>
          <div className="mt-6 space-y-3">
            {overview.auditEvents.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-white/8 bg-black/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{entry.summary.headline}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {entry.eventType}
                    </p>
                  </div>
                  <p className="text-xs text-zinc-500">{formatDateTime(entry.createdAt)}</p>
                </div>
                <p className="mt-3 text-sm text-zinc-400">{entry.summary.detail}</p>
                <p className="mt-2 text-xs text-zinc-500">
                  Member: {entry.user?.username ?? "Unknown"}
                  {" · "}
                  {formatForumUid(entry.user?.forumUid)}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Actor: {entry.actor?.username ?? "system"}
                </p>
              </div>
            ))}
            {overview.auditEvents.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No skip or queue audit records match the current filters.
              </p>
            ) : null}
          </div>
        </Card>
      </div>
    </SiteShell>
  );
}
