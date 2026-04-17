import {
  getForumOperationsConfigHealth,
  internalJobNames,
  summarizeLatestJobRuns,
} from "@/server/queries/staff-job-runs";

describe("staff job run summaries", () => {
  it("exposes every tracked forum job even when no runs exist", () => {
    expect(summarizeLatestJobRuns([])).toEqual(
      internalJobNames.map((jobName) => ({
        jobName,
        latestRun: null,
      })),
    );
  });

  it("keeps only the most recent run per job", () => {
    const summary = summarizeLatestJobRuns([
      {
        id: "run-1",
        jobName: "decay",
        status: "failed",
        startedAt: new Date("2026-04-14T20:00:00.000Z"),
        finishedAt: new Date("2026-04-14T20:01:00.000Z"),
        processedCount: 0,
        errorSummary: "database timeout",
      },
      {
        id: "run-2",
        jobName: "decay",
        status: "succeeded",
        startedAt: new Date("2026-04-14T21:00:00.000Z"),
        finishedAt: new Date("2026-04-14T21:00:30.000Z"),
        processedCount: 4,
        errorSummary: null,
      },
      {
        id: "run-3",
        jobName: "webhook-deliveries",
        status: "failed",
        startedAt: new Date("2026-04-14T21:30:00.000Z"),
        finishedAt: new Date("2026-04-14T21:31:00.000Z"),
        processedCount: 12,
        errorSummary: "Webhook returned HTTP 500",
      },
    ]);

    expect(summary).toContainEqual({
      jobName: "decay",
      latestRun: expect.objectContaining({
        id: "run-2",
        status: "succeeded",
        processedCount: 4,
      }),
    });

    expect(summary).toContainEqual({
      jobName: "webhook-deliveries",
      latestRun: expect.objectContaining({
        id: "run-3",
        status: "failed",
        errorSummary: "Webhook returned HTTP 500",
      }),
    });
  });

  it("summarizes forum config health without exposing secrets", () => {
    const summary = getForumOperationsConfigHealth({
      NEXTAUTH_URL: "https://forum.zerofall.com",
      DISCORD_WEBHOOK_URL: "https://bot.zerofall.com/api/webhooks/forum",
      DISCORD_WEBHOOK_SECRET: "secret",
      DISCORD_OAUTH_CLIENT_ID: "client-id",
      DISCORD_OAUTH_CLIENT_SECRET: "client-secret",
      INTERNAL_JOB_SECRET: "job-secret",
      CRON_SECRET: "cron-secret",
      STRIPE_SECRET_KEY: "sk_live",
      STRIPE_ENTRY_PRICE_ID: "price_entry",
      STRIPE_MEMBERSHIP_PRICE_ID: "price_membership",
      STRIPE_WEBHOOK_SECRET: "whsec_live",
    });

    expect(summary.counts).toEqual({
      ready: 7,
      warning: 0,
      missing: 0,
    });
    expect(summary.discordCallbackUrl).toBe(
      "https://forum.zerofall.com/api/discord/callback",
    );
    expect(summary.checks).toContainEqual({
      key: "discord-webhook-secret",
      label: "Bot webhook secret",
      status: "ready",
      detail: "Shared secret present",
    });
  });

  it("flags missing or non-canonical env values", () => {
    const summary = getForumOperationsConfigHealth({
      AUTH_URL: "http://internal-forum",
      DISCORD_WEBHOOK_URL: "https://bot.zerofall.com/webhooks/forum",
      DISCORD_OAUTH_CLIENT_ID: "client-only",
    });

    expect(summary.counts.warning).toBeGreaterThan(0);
    expect(summary.counts.missing).toBeGreaterThan(0);
    expect(summary.checks).toContainEqual({
      key: "discord-webhook-url",
      label: "Bot webhook target",
      status: "warning",
      detail: "https://bot.zerofall.com/webhooks/forum",
    });
    expect(summary.checks).toContainEqual({
      key: "discord-oauth",
      label: "Discord OAuth client",
      status: "warning",
      detail: "Set DISCORD_OAUTH_CLIENT_ID and DISCORD_OAUTH_CLIENT_SECRET",
    });
  });
});
