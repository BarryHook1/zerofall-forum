import { prisma } from "@/lib/db/prisma";

export const purchaseRepository = {
  findByCheckoutSessionId(checkoutSessionId: string) {
    return prisma.entryPurchase.findFirst({
      where: { providerCheckoutSessionId: checkoutSessionId },
    });
  },
  findByPaymentId(providerPaymentId: string) {
    return prisma.entryPurchase.findFirst({
      where: { providerPaymentId },
    });
  },
};
