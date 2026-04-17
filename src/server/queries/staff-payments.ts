import { prisma } from "@/lib/db/prisma";

const paymentAuditEvents = [
  "entry.payment_confirmed",
  "membership.activated",
  "membership.expired",
] as const;

export async function getStaffPaymentsOverview() {
  const [
    entryCounts,
    subscriptionCounts,
    recentEntryPurchases,
    recentSubscriptions,
    recentPaymentEvents,
  ] = await Promise.all([
    prisma.entryPurchase.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.subscription.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.entryPurchase.findMany({
      include: {
        user: {
          select: {
            username: true,
            email: true,
            forumUid: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 12,
    }),
    prisma.subscription.findMany({
      include: {
        user: {
          select: {
            username: true,
            email: true,
            forumUid: true,
            membershipStatus: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 12,
    }),
    prisma.auditLog.findMany({
      where: {
        eventType: { in: [...paymentAuditEvents] },
      },
      include: {
        user: {
          select: {
            username: true,
            email: true,
            forumUid: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 12,
    }),
  ]);

  const entryStatusCounts = {
    pending: 0,
    paid: 0,
    failed: 0,
    refunded: 0,
    canceled: 0,
  };

  for (const row of entryCounts) {
    entryStatusCounts[row.status] = row._count._all;
  }

  const subscriptionStatusCounts = {
    pending: 0,
    active: 0,
    past_due: 0,
    expired: 0,
    canceled: 0,
    revoked: 0,
  };

  for (const row of subscriptionCounts) {
    subscriptionStatusCounts[row.status] = row._count._all;
  }

  return {
    entryStatusCounts,
    subscriptionStatusCounts,
    recentEntryPurchases,
    recentSubscriptions,
    recentPaymentEvents,
  };
}
