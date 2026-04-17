import type { Prisma, WebhookDeliveryStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { botWebhookEvents } from "@/lib/discord/payloads";

const discordSyncAuditEvents = [
  "discord.webhook_skipped",
  "discord.webhook_queued",
] as const;

const discordSyncStatuses = [
  "pending",
  "processing",
  "failed",
  "succeeded",
] as const satisfies readonly WebhookDeliveryStatus[];

const discordSyncSkippedReasons = [
  "missing_discord_user_id",
  "missing_uid",
] as const;

const DEFAULT_PAGE_SIZE = 20;
const STUCK_PROCESSING_WINDOW_MS = 15 * 60 * 1000;

type DiscordSyncAuditEvent = (typeof discordSyncAuditEvents)[number];
type SearchParamValue = string | string[] | undefined;
type JsonRecord = Record<string, Prisma.JsonValue>;

export type DiscordSyncFilters = {
  status: WebhookDeliveryStatus | "all";
  eventName: string | null;
  hasError: boolean | null;
  skipReason: (typeof discordSyncSkippedReasons)[number] | null;
  page: number;
  pageSize: number;
};

function asJsonRecord(value: Prisma.JsonValue): JsonRecord | null {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return null;
  }

  return value as JsonRecord;
}

function readString(value: Prisma.JsonValue | undefined) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readSearchParam(value: SearchParamValue) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readPositiveInt(value: SearchParamValue, fallback: number) {
  const parsed = Number.parseInt(readSearchParam(value) ?? "", 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function normalizeDiscordSyncFilters(
  searchParams: Record<string, SearchParamValue>,
): DiscordSyncFilters {
  const statusParam = readSearchParam(searchParams.status);
  const skippedReasonParam =
    readSearchParam(searchParams.skipReason) ??
    readSearchParam(searchParams.skippedReason);
  const hasErrorParam = readSearchParam(searchParams.hasError);
  const eventNameParam =
    readSearchParam(searchParams.eventName) ?? readSearchParam(searchParams.event);

  return {
    status:
      statusParam && discordSyncStatuses.includes(statusParam as WebhookDeliveryStatus)
        ? (statusParam as WebhookDeliveryStatus)
        : "all",
    eventName:
      eventNameParam && botWebhookEvents.includes(eventNameParam as (typeof botWebhookEvents)[number])
        ? eventNameParam
        : null,
    hasError:
      hasErrorParam === "true"
        ? true
        : hasErrorParam === "false"
          ? false
          : null,
    skipReason:
      skippedReasonParam &&
      discordSyncSkippedReasons.includes(
        skippedReasonParam as (typeof discordSyncSkippedReasons)[number],
      )
        ? (skippedReasonParam as (typeof discordSyncSkippedReasons)[number])
        : null,
    page: readPositiveInt(searchParams.page, 1),
    pageSize: DEFAULT_PAGE_SIZE,
  };
}

export function summarizeDiscordSyncAuditMeta(
  eventType: DiscordSyncAuditEvent,
  metaJson: Prisma.JsonValue,
) {
  const meta = asJsonRecord(metaJson);

  if (eventType === "discord.webhook_skipped") {
    return {
      headline: readString(meta?.reason) ?? "skipped",
      detail:
        readString(meta?.requestedEvent) ??
        readString(meta?.eventName) ??
        "No event recorded",
      deliveryId: null,
    };
  }

  return {
    headline: readString(meta?.eventName) ?? "queued",
    detail: readString(meta?.deliveryId) ?? "Delivery id pending",
    deliveryId: readString(meta?.deliveryId),
  };
}

export function isWebhookDeliveryStuck(
  delivery: {
    status: WebhookDeliveryStatus;
    nextAttemptAt: Date;
    lastAttemptAt: Date | null;
    attemptCount: number;
  },
  now = new Date(),
) {
  if (
    delivery.status === "failed" &&
    delivery.attemptCount > 0 &&
    delivery.nextAttemptAt.getTime() <= now.getTime()
  ) {
    return true;
  }

  if (
    delivery.status === "processing" &&
    delivery.lastAttemptAt &&
    delivery.lastAttemptAt.getTime() <= now.getTime() - STUCK_PROCESSING_WINDOW_MS
  ) {
    return true;
  }

  return false;
}

export function buildDiscordSyncDeliveryWhere(
  filters: DiscordSyncFilters,
): Prisma.WebhookDeliveryWhereInput {
  const where: Prisma.WebhookDeliveryWhereInput = {};

  if (filters.status !== "all") {
    where.status = filters.status;
  }

  if (filters.eventName) {
    where.eventName = filters.eventName;
  }

  if (filters.hasError === true) {
    where.lastError = { not: null };
  }

  if (filters.hasError === false) {
    where.lastError = null;
  }

  return where;
}

export function parseDiscordSyncSearchParams(
  searchParams: Record<string, SearchParamValue>,
) {
  const filters = normalizeDiscordSyncFilters(searchParams);

  return {
    page: filters.page,
    status: filters.status,
    eventName: filters.eventName,
    hasError: filters.hasError,
    skipReason: filters.skipReason,
  };
}

export async function getStaffDiscordSyncOverview(
  searchParams: Record<string, SearchParamValue> = {},
) {
  const filters = normalizeDiscordSyncFilters(searchParams);
  const now = new Date();
  const deliveryWhere = buildDiscordSyncDeliveryWhere(filters);
  const skip = (filters.page - 1) * filters.pageSize;

  const [deliveryCounts, skippedCount, queuedCount, deliveriesRaw, filteredCount, auditEventsRaw, recentFailures, stuckRetries] =
    await Promise.all([
      prisma.webhookDelivery.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.auditLog.count({
        where: { eventType: "discord.webhook_skipped" },
      }),
      prisma.auditLog.count({
        where: { eventType: "discord.webhook_queued" },
      }),
      prisma.webhookDelivery.findMany({
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              forumUid: true,
              discordId: true,
            },
          },
        },
        where: deliveryWhere,
        orderBy: [{ createdAt: "desc" }],
        skip,
        take: filters.pageSize + 1,
      }),
      prisma.webhookDelivery.count({
        where: deliveryWhere,
      }),
      prisma.auditLog.findMany({
        where: {
          eventType: {
            in: [...discordSyncAuditEvents],
          },
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              forumUid: true,
              discordId: true,
            },
          },
          actor: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }],
        take: 60,
      }),
      prisma.webhookDelivery.findMany({
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              forumUid: true,
              discordId: true,
            },
          },
        },
        where: {
          status: "failed",
          ...(filters.eventName ? { eventName: filters.eventName } : {}),
        },
        orderBy: [{ lastAttemptAt: "desc" }, { createdAt: "desc" }],
        take: 6,
      }),
      prisma.webhookDelivery.findMany({
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              forumUid: true,
              discordId: true,
            },
          },
        },
        where: {
          ...(filters.eventName ? { eventName: filters.eventName } : {}),
          OR: [
            {
              status: "failed",
              attemptCount: { gt: 0 },
              nextAttemptAt: { lte: now },
            },
            {
              status: "processing",
              lastAttemptAt: {
                lte: new Date(now.getTime() - STUCK_PROCESSING_WINDOW_MS),
              },
            },
          ],
        },
        orderBy: [{ lastAttemptAt: "asc" }, { createdAt: "asc" }],
        take: 6,
      }),
    ]);

  const counts = {
    pending: 0,
    processing: 0,
    succeeded: 0,
    failed: 0,
    skipped: skippedCount,
    queued: queuedCount,
  };

  for (const row of deliveryCounts) {
    counts[row.status] = row._count._all;
  }

  const deliveries = deliveriesRaw.slice(0, filters.pageSize);
  const hasNextPage = deliveriesRaw.length > filters.pageSize;
  const totalPages = Math.max(1, Math.ceil(filteredCount / filters.pageSize));

  const auditEvents = auditEventsRaw
    .map((entry) => ({
      ...entry,
      summary: summarizeDiscordSyncAuditMeta(
        entry.eventType as DiscordSyncAuditEvent,
        entry.metaJson,
      ),
      reason:
        entry.eventType === "discord.webhook_skipped"
          ? readString(asJsonRecord(entry.metaJson)?.reason)
          : null,
      eventName:
        readString(asJsonRecord(entry.metaJson)?.requestedEvent) ??
        readString(asJsonRecord(entry.metaJson)?.eventName),
    }))
    .filter((entry) => {
      if (filters.skipReason && entry.reason !== filters.skipReason) {
        return false;
      }

      if (filters.eventName && entry.eventName !== filters.eventName) {
        return false;
      }

      return true;
    })
    .slice(0, 12);

  return {
    counts,
    filters,
    filterOptions: {
      statuses: ["all", ...discordSyncStatuses] as const,
      eventNames: botWebhookEvents,
      skippedReasons: discordSyncSkippedReasons,
    },
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages,
      totalResults: filteredCount,
      hasNextPage,
      hasPreviousPage: filters.page > 1,
    },
    deliveries,
    auditEvents,
    recentFailures,
    stuckRetries: stuckRetries.filter((delivery) =>
      isWebhookDeliveryStuck(delivery, now),
    ),
  };
}
