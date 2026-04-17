import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { BotWebhookPublisher } from "@/server/services/bot-webhook-publisher";

const botWebhookPublisher = new BotWebhookPublisher();

export async function processDecayJob() {
  const dormantUsers = await prisma.user.findMany({
    where: {
      membershipStatus: "dormant",
      decayState: "dormant",
    },
  });

  for (const user of dormantUsers) {
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        membershipStatus: "decayed",
        decayState: "decayed",
      },
    });
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        eventType: "member.decayed",
        metaJson: { job: "decay" } as Prisma.InputJsonValue,
      },
    });
    await botWebhookPublisher.publishUserEvent({
      user: updatedUser,
      event: "subscription.decayed",
    });
  }

  return dormantUsers.length;
}
