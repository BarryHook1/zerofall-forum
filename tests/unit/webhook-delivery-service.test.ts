import { createForumWebhookSignature } from "@/lib/discord/signature";
import { WebhookDeliveryService } from "@/server/services/webhook-delivery-service";

describe("webhook delivery service", () => {
  it("queues signed webhook deliveries", async () => {
    process.env.DISCORD_WEBHOOK_URL = "https://discord.example/api/webhooks/forum";
    process.env.DISCORD_WEBHOOK_SECRET = "secret";

    const created: Record<string, unknown>[] = [];
    const service = new WebhookDeliveryService(
      {
        async create(input) {
          created.push(input);
        },
        async listPending() {
          return [];
        },
        async markProcessing() {},
        async markSucceeded() {},
        async markFailed() {},
      },
      fetch,
    );

    const result = await service.queueWebhook({
      userId: "user-1",
      eventName: "member.created",
      payload: {
        type: "member.created",
        event: "member.created",
        discordUserId: "130467578182238215",
        uid: "UID0001",
        forumMemberId: "fm_0001",
        timestamp: "2026-04-14T21:00:00.000Z",
      },
    });

    expect(result.deliveryId).toBeDefined();
    expect(result.signature).toMatch(/^[a-f0-9]{64}$/);
    expect(created).toHaveLength(1);
  });

  it("retries failed webhook deliveries with backoff", async () => {
    const state = {
      processing: [] as string[],
      succeeded: [] as string[],
      failed: [] as string[],
    };

    const service = new WebhookDeliveryService(
      {
        async create() {},
        async listPending() {
          return [
            {
              id: "1",
              deliveryId: "delivery-1",
              eventName: "member.created",
              targetUrl: "https://discord.example/api/webhooks/forum",
              signature: "abc",
              payloadJson: {
                type: "member.created",
                event: "member.created",
                discordUserId: "130467578182238215",
                uid: "UID0001",
                forumMemberId: "fm_0001",
                timestamp: "2026-04-14T21:00:00.000Z",
              },
              attemptCount: 0,
            },
          ];
        },
        async markProcessing(id) {
          state.processing.push(id);
        },
        async markSucceeded(id) {
          state.succeeded.push(id);
        },
        async markFailed(id) {
          state.failed.push(id);
        },
      },
      async () =>
        new Response("boom", {
          status: 500,
        }),
    );

    const processed = await service.processPendingDeliveries(new Date("2026-04-14T00:00:00Z"));

    expect(processed).toBe(1);
    expect(state.processing).toEqual(["1"]);
    expect(state.succeeded).toEqual([]);
    expect(state.failed).toEqual(["1"]);
  });

  it("signs the exact serialized body at send time", async () => {
    process.env.DISCORD_WEBHOOK_SECRET = "secret";

    const sent: {
      body?: string;
      signature?: string;
    } = {};

    const service = new WebhookDeliveryService(
      {
        async create() {},
        async listPending() {
          return [
            {
              id: "1",
              deliveryId: "delivery-1",
              eventName: "subscription.activated",
              targetUrl: "https://discord.example/api/webhooks/forum",
              signature: "stale-signature",
              payloadJson: {
                type: "subscription.activated",
                event: "subscription.activated",
                rank: "genesis_founder",
                uid: "UID0001",
                discordUserId: "1234567890",
                forumMemberId: "fm_0001",
                timestamp: "2026-04-14T21:15:00.000Z",
              },
              attemptCount: 0,
            },
          ];
        },
        async markProcessing() {},
        async markSucceeded() {},
        async markFailed() {},
      },
      async (_input, init) => {
        sent.body = String(init?.body ?? "");
        sent.signature = String(
          (init?.headers as Record<string, string>)["x-zf-signature"],
        );
        return new Response("ok", { status: 202 });
      },
    );

    await service.processPendingDeliveries(new Date("2026-04-14T00:00:00Z"));

    expect(sent.body).toBe(
      JSON.stringify({
        type: "subscription.activated",
        event: "subscription.activated",
        rank: "genesis_founder",
        uid: "UID0001",
        discordUserId: "1234567890",
        forumMemberId: "fm_0001",
        timestamp: "2026-04-14T21:15:00.000Z",
      }),
    );
    expect(sent.signature).toBe(
      createForumWebhookSignature(sent.body ?? "", "secret"),
    );
    expect(sent.signature).not.toBe("stale-signature");
  });

  it("rejects non-canonical webhook urls", async () => {
    process.env.DISCORD_WEBHOOK_URL = "https://discord.example/webhooks/forum";
    process.env.DISCORD_WEBHOOK_SECRET = "secret";

    const service = new WebhookDeliveryService(
      {
        async create() {},
        async listPending() {
          return [];
        },
        async markProcessing() {},
        async markSucceeded() {},
        async markFailed() {},
      },
      fetch,
    );

    await expect(
      service.queueWebhook({
        userId: "user-1",
        eventName: "member.created",
        payload: {
          type: "member.created",
          event: "member.created",
          discordUserId: "130467578182238215",
          uid: "UID0001",
          forumMemberId: "fm_0001",
          timestamp: "2026-04-14T21:00:00.000Z",
        },
      }),
    ).rejects.toThrow("DISCORD_WEBHOOK_URL must point to /api/webhooks/forum");
  });
});
