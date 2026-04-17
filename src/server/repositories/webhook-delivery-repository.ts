import { prisma } from "@/lib/db/prisma";

export const webhookDeliveryRepository = {
  listPending(now: Date) {
    return prisma.webhookDelivery.findMany({
      where: {
        status: { in: ["pending", "failed"] },
        nextAttemptAt: { lte: now },
      },
      orderBy: { createdAt: "asc" },
      take: 20,
    });
  },
};
