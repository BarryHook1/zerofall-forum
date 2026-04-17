import { prisma } from "@/lib/db/prisma";
import { internalJobNames, type InternalJobName } from "@/lib/jobs/monitoring";

export { internalJobNames };

type LegacyJobRunMeta = {
  jobName: InternalJobName | "unknown";
  trigger: string;
  status: string;
  processed: number;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
};

type JobRunSummary = {
  id: string;
  jobName: string;
  status: "running" | "succeeded" | "failed";
  startedAt: Date;
  finishedAt: Date | null;
  processedCount: number | null;
  errorSummary: string | null;
};

export type ForumConfigHealthStatus = "ready" | "warning" | "missing";

export type ForumConfigHealthCheck = {
  key: string;
  label: string;
  status: ForumConfigHealthStatus;
  detail: string;
};

export function summarizeJobRunMeta(value: unknown): LegacyJobRunMeta {
  const record =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  return {
    jobName: internalJobNames.includes(record.jobName as InternalJobName)
      ? (record.jobName as InternalJobName)
      : "unknown",
    trigger: typeof record.trigger === "string" ? record.trigger : "unknown",
    status: typeof record.status === "string" ? record.status : "unknown",
    processed: typeof record.processed === "number" ? record.processed : 0,
    error: typeof record.error === "string" ? record.error : null,
    startedAt: typeof record.startedAt === "string" ? record.startedAt : null,
    finishedAt: typeof record.finishedAt === "string" ? record.finishedAt : null,
  };
}

export function summarizeLatestJobRuns(runs: JobRunSummary[]) {
  return internalJobNames.map((jobName) => ({
    jobName,
    latestRun:
      runs
        .filter((run) => run.jobName === jobName)
        .sort((left, right) => right.startedAt.getTime() - left.startedAt.getTime())[0] ??
      null,
  }));
}

export function getForumOperationsConfigHealth(
  env: NodeJS.ProcessEnv = process.env,
) {
  const authUrl = env.NEXTAUTH_URL ?? env.AUTH_URL ?? "";
  const webhookUrl = env.DISCORD_WEBHOOK_URL ?? "";
  const webhookPath =
    webhookUrl && (() => {
      try {
        return new URL(webhookUrl).pathname;
      } catch {
        return "";
      }
    })();

  const checks: ForumConfigHealthCheck[] = [
    {
      key: "auth-url",
      label: "Forum base URL",
      status: authUrl
        ? authUrl.startsWith("https://") || authUrl.startsWith("http://localhost")
          ? "ready"
          : "warning"
        : "missing",
      detail: authUrl || "Set NEXTAUTH_URL or AUTH_URL",
    },
    {
      key: "discord-webhook-url",
      label: "Bot webhook target",
      status: !webhookUrl
        ? "missing"
        : webhookPath === "/api/webhooks/forum"
          ? "ready"
          : "warning",
      detail: webhookUrl || "Set DISCORD_WEBHOOK_URL",
    },
    {
      key: "discord-webhook-secret",
      label: "Bot webhook secret",
      status: env.DISCORD_WEBHOOK_SECRET ? "ready" : "missing",
      detail: env.DISCORD_WEBHOOK_SECRET
        ? "Shared secret present"
        : "Set DISCORD_WEBHOOK_SECRET",
    },
    {
      key: "discord-oauth",
      label: "Discord OAuth client",
      status:
        env.DISCORD_OAUTH_CLIENT_ID && env.DISCORD_OAUTH_CLIENT_SECRET
          ? "ready"
          : env.DISCORD_OAUTH_CLIENT_ID || env.DISCORD_OAUTH_CLIENT_SECRET
            ? "warning"
            : "missing",
      detail:
        env.DISCORD_OAUTH_CLIENT_ID && env.DISCORD_OAUTH_CLIENT_SECRET
          ? "Client ID and secret present"
          : "Set DISCORD_OAUTH_CLIENT_ID and DISCORD_OAUTH_CLIENT_SECRET",
    },
    {
      key: "internal-job-secret",
      label: "Manual job auth",
      status: env.INTERNAL_JOB_SECRET ? "ready" : "missing",
      detail: env.INTERNAL_JOB_SECRET
        ? "INTERNAL_JOB_SECRET present"
        : "Set INTERNAL_JOB_SECRET",
    },
    {
      key: "cron-secret",
      label: "Scheduled job auth",
      status: env.CRON_SECRET ? "ready" : "missing",
      detail: env.CRON_SECRET ? "CRON_SECRET present" : "Set CRON_SECRET",
    },
    {
      key: "stripe-billing",
      label: "Stripe billing config",
      status:
        env.STRIPE_SECRET_KEY &&
        env.STRIPE_ENTRY_PRICE_ID &&
        env.STRIPE_MEMBERSHIP_PRICE_ID &&
        env.STRIPE_WEBHOOK_SECRET
          ? "ready"
          : "missing",
      detail:
        env.STRIPE_SECRET_KEY &&
        env.STRIPE_ENTRY_PRICE_ID &&
        env.STRIPE_MEMBERSHIP_PRICE_ID &&
        env.STRIPE_WEBHOOK_SECRET
          ? "Stripe secret, webhook, and price IDs present"
          : "Set Stripe secret, webhook secret, and both price IDs",
    },
  ];

  const counts = {
    ready: checks.filter((check) => check.status === "ready").length,
    warning: checks.filter((check) => check.status === "warning").length,
    missing: checks.filter((check) => check.status === "missing").length,
  };

  return {
    checks,
    counts,
    discordCallbackUrl: authUrl
      ? `${authUrl.replace(/\/$/, "")}/api/discord/callback`
      : null,
  };
}

export async function getStaffJobRunsOverview() {
  const [recentRuns, incidents] = await Promise.all([
    prisma.jobRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 24,
    }),
    prisma.auditLog.findMany({
      where: {
        eventType: {
          in: [
            "account.revoked",
            "membership.expired",
            "member.decayed",
            "discord.webhook_skipped",
            "discord.webhook_requeued",
            "discord.webhook_requeued_bulk",
          ],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            forumUid: true,
          },
        },
        actor: {
          select: {
            username: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 18,
    }),
  ]);

  return {
    recentRuns,
    jobs: summarizeLatestJobRuns(recentRuns),
    incidents,
    config: getForumOperationsConfigHealth(),
  };
}
