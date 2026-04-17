import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { botWebhookEvents, type BotWebhookPayload } from "@/lib/discord/payloads";
import {
  computeWebhookBackoffMs,
  createForumDeliveryId,
  createForumWebhookSignature,
} from "@/lib/discord/signature";

type QueueWebhookInput = {
  userId?: string | null;
  eventName: string;
  payload: BotWebhookPayload;
};

type DeliveryRecord = {
  id: string;
  deliveryId: string;
  eventName: string;
  targetUrl: string;
  signature: string;
  payloadJson: Prisma.JsonValue;
  attemptCount: number;
};

type DeliveryRepository = {
  create(input: {
    userId?: string | null;
    eventName: string;
    deliveryId: string;
    targetUrl: string;
    payloadJson: Prisma.InputJsonValue;
    signature: string;
  }): Promise<void>;
  listPending(now: Date): Promise<DeliveryRecord[]>;
  markProcessing(id: string): Promise<void>;
  markSucceeded(id: string): Promise<void>;
  markFailed(id: string, attemptCount: number, nextAttemptAt: Date, error: string): Promise<void>;
};

const defaultRepository: DeliveryRepository = {
  async create(input) {
    await prisma.webhookDelivery.create({
      data: {
        userId: input.userId ?? null,
        eventName: input.eventName,
        deliveryId: input.deliveryId,
        targetUrl: input.targetUrl,
        payloadJson: input.payloadJson,
        signature: input.signature,
      },
    });
  },
  async listPending(now) {
    return prisma.webhookDelivery.findMany({
      where: {
        status: { in: ["pending", "failed"] },
        nextAttemptAt: { lte: now },
      },
      orderBy: { createdAt: "asc" },
      take: 20,
    });
  },
  async markProcessing(id) {
    await prisma.webhookDelivery.update({
      where: { id },
      data: {
        status: "processing",
        attemptCount: { increment: 1 },
        lastAttemptAt: new Date(),
      },
    });
  },
  async markSucceeded(id) {
    await prisma.webhookDelivery.update({
      where: { id },
      data: {
        status: "succeeded",
        processedAt: new Date(),
      },
    });
  },
  async markFailed(id, attemptCount, nextAttemptAt, error) {
    await prisma.webhookDelivery.update({
      where: { id },
      data: {
        status: "failed",
        attemptCount,
        nextAttemptAt,
        lastError: error,
      },
    });
  },
};

export class WebhookDeliveryService {
  constructor(
    private readonly repository: DeliveryRepository = defaultRepository,
    private readonly sender: typeof fetch = fetch,
  ) {}

  async queueWebhook({ userId = null, eventName, payload }: QueueWebhookInput) {
    const targetUrl = process.env.DISCORD_WEBHOOK_URL;
    const secret = process.env.DISCORD_WEBHOOK_SECRET;

    if (!targetUrl || !secret) {
      throw new Error("Discord webhook environment variables are not configured");
    }

    const url = new URL(targetUrl);
    if (url.pathname !== "/api/webhooks/forum") {
      throw new Error("DISCORD_WEBHOOK_URL must point to /api/webhooks/forum");
    }

    if (!botWebhookEvents.includes(payload.event)) {
      throw new Error(`Unsupported bot webhook event: ${payload.event}`);
    }

    if (payload.event !== eventName || payload.type !== eventName) {
      throw new Error("Webhook payload event/type must match eventName");
    }

    if (!payload.discordUserId) {
      throw new Error("Webhook payload requires discordUserId");
    }

    if (!payload.uid) {
      throw new Error("Webhook payload requires uid");
    }

    if (!payload.forumMemberId) {
      throw new Error("Webhook payload requires forumMemberId");
    }

    if (!payload.timestamp) {
      throw new Error("Webhook payload requires timestamp");
    }

    const serializedPayload = JSON.stringify(payload);
    const deliveryId = createForumDeliveryId();
    const signature = createForumWebhookSignature(serializedPayload, secret);

    await this.repository.create({
      userId,
      eventName,
      deliveryId,
      targetUrl,
      payloadJson: payload,
      signature,
    });

    return { deliveryId, signature };
  }

  async processPendingDeliveries(now = new Date()) {
    const secret = process.env.DISCORD_WEBHOOK_SECRET;

    if (!secret) {
      throw new Error("Discord webhook environment variables are not configured");
    }

    const deliveries = await this.repository.listPending(now);

    for (const delivery of deliveries) {
      await this.repository.markProcessing(delivery.id);

      try {
        const body = JSON.stringify(delivery.payloadJson);
        const signature = createForumWebhookSignature(body, secret);
        const response = await this.sender(delivery.targetUrl, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-zf-event": delivery.eventName,
            "x-zf-delivery-id": delivery.deliveryId,
            "x-zf-signature": signature,
          },
          body,
        });

        if (!response.ok) {
          throw new Error(`Webhook returned HTTP ${response.status}`);
        }

        await this.repository.markSucceeded(delivery.id);
      } catch (error) {
        const nextAttemptCount = delivery.attemptCount + 1;
        const nextAttemptAt = new Date(
          now.getTime() + computeWebhookBackoffMs(nextAttemptCount),
        );
        await this.repository.markFailed(
          delivery.id,
          nextAttemptCount,
          nextAttemptAt,
          error instanceof Error ? error.message : "Unknown delivery error",
        );
      }
    }

    return deliveries.length;
  }
}
