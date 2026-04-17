import {
  buildBotWebhookPayload,
  formatBotWebhookUid,
  mapForumEventToBotEvent,
} from "@/lib/discord/payloads";

describe("forum to bot webhook payloads", () => {
  it("formats webhook uids with the UID prefix", () => {
    expect(formatBotWebhookUid(1)).toBe("UID0001");
    expect(formatBotWebhookUid(42)).toBe("UID0042");
    expect(formatBotWebhookUid(null)).toBeNull();
  });

  it("maps forum lifecycle events to the allowed bot event set", () => {
    expect(mapForumEventToBotEvent("member.created", "none")).toBe("member.created");
    expect(mapForumEventToBotEvent("member.reactivated", "verified")).toBe(
      "subscription.activated",
    );
    expect(mapForumEventToBotEvent("rank.updated", "none")).toBe("rank.revoked");
    expect(mapForumEventToBotEvent("rank.updated", "elite")).toBe("rank.granted");
  });

  it("builds a compatibility payload with type and event", () => {
    const payload = buildBotWebhookPayload(
      "subscription.activated",
      {
        id: "fm_test_9001",
        forumUid: 9001,
        discordId: "130467578182238215",
        rank: "verified",
        subscriptionExpiresAt: new Date("2026-05-14T21:00:00.000Z"),
      },
      new Date("2026-04-14T21:05:00.000Z"),
    );

    expect(payload).toEqual({
      type: "subscription.activated",
      event: "subscription.activated",
      discordUserId: "130467578182238215",
      uid: "UID9001",
      forumMemberId: "fm_test_9001",
      rank: "verified",
      expiresAt: "2026-05-14T21:00:00.000Z",
      timestamp: "2026-04-14T21:05:00.000Z",
    });
  });

  it("returns null when the bot contract cannot be satisfied", () => {
    expect(
      buildBotWebhookPayload("member.created", {
        id: "fm_test_9001",
        forumUid: 9001,
        discordId: null,
        rank: "none",
      }),
    ).toBeNull();

    expect(
      buildBotWebhookPayload("member.created", {
        id: "fm_test_9001",
        forumUid: null,
        discordId: "130467578182238215",
        rank: "none",
      }),
    ).toBeNull();
  });
});
