import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { BotWebhookPublisher } from "@/server/services/bot-webhook-publisher";

const botWebhookPublisher = new BotWebhookPublisher();

export class StaffService {
  async revokeUser(userId: string, actorId?: string | null) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        membershipStatus: "revoked",
        entryStatus: "revoked",
      },
    });
    await prisma.activationWindow.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    });
    await prisma.auditLog.create({
      data: {
        userId,
        actorId: actorId ?? null,
        eventType: "account.revoked",
        metaJson: {} as Prisma.InputJsonValue,
      },
    });

    await botWebhookPublisher.publishUserEvent({
      user,
      event: "account.revoked",
      actorId,
    });

    return user;
  }

  async reactivateUser(userId: string, actorId?: string | null) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        membershipStatus: "active",
        decayState: "none",
      },
    });
    await prisma.auditLog.create({
      data: {
        userId,
        actorId: actorId ?? null,
        eventType: "member.reactivated",
        metaJson: {} as Prisma.InputJsonValue,
      },
    });

    await botWebhookPublisher.publishUserEvent({
      user,
      event: "member.reactivated",
      actorId,
    });

    return user;
  }

  async updateRank(userId: string, rank: "none" | "verified" | "elite" | "vanguard" | "genesis_founder", actorId?: string | null) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { rank },
    });
    await prisma.rank.create({
      data: {
        userId,
        rankCode: rank,
      },
    });
    await prisma.auditLog.create({
      data: {
        userId,
        actorId: actorId ?? null,
        eventType: "rank.updated",
        metaJson: { rank } as Prisma.InputJsonValue,
      },
    });

    await botWebhookPublisher.publishUserEvent({
      user,
      event: "rank.updated",
      actorId,
    });

    return user;
  }

  async requeueWebhook(deliveryId: string, actorId?: string | null) {
    const delivery = await prisma.webhookDelivery.update({
      where: { deliveryId },
      data: {
        status: "pending",
        nextAttemptAt: new Date(),
        processedAt: null,
        lastError: null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: delivery.userId,
        actorId: actorId ?? null,
        eventType: "discord.webhook_requeued",
        metaJson: { deliveryId } as Prisma.InputJsonValue,
      },
    });

    return delivery;
  }

  async requeueAllFailedWebhooks(actorId?: string | null) {
    const result = await prisma.webhookDelivery.updateMany({
      where: { status: "failed" },
      data: {
        status: "pending",
        nextAttemptAt: new Date(),
        processedAt: null,
        lastError: null,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actorId ?? null,
        eventType: "discord.webhook_requeued_bulk",
        metaJson: { count: result.count } as Prisma.InputJsonValue,
      },
    });

    return { count: result.count };
  }

  async requeueFailedWebhooks(actorId?: string | null) {
    return this.requeueAllFailedWebhooks(actorId);
  }
}
