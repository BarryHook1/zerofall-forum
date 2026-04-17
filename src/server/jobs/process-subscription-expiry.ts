import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { BotWebhookPublisher } from "@/server/services/bot-webhook-publisher";

const botWebhookPublisher = new BotWebhookPublisher();

export async function processSubscriptionExpiryJob(now = new Date()) {
  const expiring = await prisma.user.findMany({
    where: {
      membershipStatus: "active",
      subscriptionExpiresAt: { lte: now },
    },
  });

  for (const user of expiring) {
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        membershipStatus: "dormant",
        decayState: "dormant",
      },
    });
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        eventType: "membership.expired",
        metaJson: { job: "subscription-expiry" } as Prisma.InputJsonValue,
      },
    });
    await botWebhookPublisher.publishUserEvent({
      user: updatedUser,
      event: "subscription.expired",
    });
  }

  return expiring.length;
}
