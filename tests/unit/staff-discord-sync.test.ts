import {
  buildDiscordSyncDeliveryWhere,
  parseDiscordSyncSearchParams,
  summarizeDiscordSyncAuditMeta,
} from "@/server/queries/staff-discord-sync";

describe("staff discord sync summaries", () => {
  it("parses filter inputs defensively", () => {
    expect(
      parseDiscordSyncSearchParams({
        page: "0",
        status: "failed",
        event: "subscription.activated",
        hasError: "true",
        skipReason: "missing_uid",
      }),
    ).toEqual({
      page: 1,
      status: "failed",
      eventName: "subscription.activated",
      hasError: true,
      skipReason: "missing_uid",
    });
  });

  it("builds a delivery where clause from parsed filters", () => {
    expect(
      buildDiscordSyncDeliveryWhere({
        page: 2,
        status: "failed",
        eventName: "member.created",
        hasError: true,
        skipReason: null,
      }),
    ).toEqual({
      status: "failed",
      eventName: "member.created",
      lastError: { not: null },
    });
  });

  it("summarizes skipped webhook audit rows", () => {
    expect(
      summarizeDiscordSyncAuditMeta("discord.webhook_skipped", {
        reason: "missing_discord_user_id",
        eventName: "member.created",
      }),
    ).toEqual({
      headline: "missing_discord_user_id",
      detail: "member.created",
      deliveryId: null,
    });
  });

  it("summarizes queued webhook audit rows", () => {
    expect(
      summarizeDiscordSyncAuditMeta("discord.webhook_queued", {
        eventName: "subscription.activated",
        deliveryId: "delivery_test_123",
      }),
    ).toEqual({
      headline: "subscription.activated",
      detail: "delivery_test_123",
      deliveryId: "delivery_test_123",
    });
  });
});
