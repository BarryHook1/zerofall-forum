import { prisma } from "@/lib/db/prisma";

const decayAuditEvents = [
  "membership.expired",
  "member.decayed",
  "member.reactivated",
  "account.revoked",
] as const;

export async function getStaffDecayOverview(now = new Date()) {
  const recentThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    dormantCount,
    decayedCount,
    recentExpiredCount,
    recentDecayedCount,
    dormantUsers,
    decayedUsers,
    recentDecayEvents,
  ] = await Promise.all([
    prisma.user.count({
      where: { membershipStatus: "dormant" },
    }),
    prisma.user.count({
      where: { membershipStatus: "decayed" },
    }),
    prisma.auditLog.count({
      where: {
        eventType: "membership.expired",
        createdAt: { gte: recentThreshold },
      },
    }),
    prisma.auditLog.count({
      where: {
        eventType: "member.decayed",
        createdAt: { gte: recentThreshold },
      },
    }),
    prisma.user.findMany({
      where: { membershipStatus: "dormant" },
      orderBy: [{ subscriptionExpiresAt: "desc" }],
      take: 12,
    }),
    prisma.user.findMany({
      where: { membershipStatus: "decayed" },
      orderBy: [{ updatedAt: "desc" }],
      take: 12,
    }),
    prisma.auditLog.findMany({
      where: {
        eventType: { in: [...decayAuditEvents] },
      },
      include: {
        user: {
          select: {
            username: true,
            email: true,
            forumUid: true,
          },
        },
        actor: {
          select: {
            username: true,
            email: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 14,
    }),
  ]);

  return {
    dormantCount,
    decayedCount,
    recentExpiredCount,
    recentDecayedCount,
    dormantUsers,
    decayedUsers,
    recentDecayEvents,
  };
}
