import { prisma } from "@/lib/db/prisma";

export const subscriptionRepository = {
  findByProviderSubscriptionId(providerSubscriptionId: string) {
    return prisma.subscription.findUnique({
      where: { providerSubscriptionId },
    });
  },
};
