import { prisma } from "@/lib/db/prisma";

const billingAuditEvents = [
  "entry.payment_confirmed",
  "entry.uid_issued",
  "membership.activated",
  "membership.expired",
  "member.reactivated",
] as const;

export function selectActiveSubscription<
  T extends { status: string } | null | undefined,
>(subscriptions: T[]) {
  return subscriptions.find((subscription) => subscription?.status === "active") ??
    subscriptions[0] ??
    null;
}

export async function getMemberBillingOverview(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      entryPurchases: {
        orderBy: { createdAt: "desc" },
        take: 12,
      },
      subscriptions: {
        orderBy: { updatedAt: "desc" },
        take: 12,
      },
      auditLogs: {
        where: {
          eventType: { in: [...billingAuditEvents] },
        },
        orderBy: { createdAt: "desc" },
        take: 16,
      },
    },
  });

  const latestEntryPurchase = user.entryPurchases[0] ?? null;
  const activeSubscription = selectActiveSubscription(user.subscriptions);

  return {
    user,
    latestEntryPurchase,
    activeSubscription,
  };
}
