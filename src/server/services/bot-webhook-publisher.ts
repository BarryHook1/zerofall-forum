import { createAuditLog } from "@/lib/audit/logging";
import { buildBotWebhookPayload } from "@/lib/discord/payloads";
import { WebhookDeliveryService } from "@/server/services/webhook-delivery-service";

type PublishableUser = Parameters<typeof buildBotWebhookPayload>[1];
type PublishableEvent = Parameters<typeof buildBotWebhookPayload>[0];

export class BotWebhookPublisher {
  constructor(
    private readonly webhookService = new WebhookDeliveryService(),
  ) {}

  async publishUserEvent(input: {
    user: PublishableUser;
    event: PublishableEvent;
    actorId?: string | null;
    timestamp?: Date;
  }) {
    const payload = buildBotWebhookPayload(
      input.event,
      input.user,
      input.timestamp,
    );

    if (!payload) {
      const reason = !input.user.discordId ? "missing_discord_user_id" : "missing_uid";

      await createAuditLog({
        userId: input.user.id,
        actorId: input.actorId ?? null,
        eventType: "discord.webhook_skipped",
        meta: {
          requestedEvent: input.event,
          reason,
        },
      });

      return {
        queued: false as const,
        reason,
      };
    }

    const queued = await this.webhookService.queueWebhook({
      userId: input.user.id,
      eventName: payload.event,
      payload,
    });

    await createAuditLog({
      userId: input.user.id,
      actorId: input.actorId ?? null,
      eventType: "discord.webhook_queued",
      meta: {
        eventName: payload.event,
        deliveryId: queued.deliveryId,
      },
    });

    return {
      queued: true as const,
      eventName: payload.event,
      deliveryId: queued.deliveryId,
    };
  }
}
