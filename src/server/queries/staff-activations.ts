import { prisma } from "@/lib/db/prisma";

const activationAuditEvents = [
  "entry.account_created",
  "entry.activation_deadline_created",
  "membership.activated",
  "account.revoked",
] as const;

export function classifyActivationWindow(deadline: Date | null, now = new Date()) {
  if (!deadline) {
    return "missing_deadline";
  }

  if (deadline <= now) {
    return "overdue";
  }

  const remainingHours = (deadline.getTime() - now.getTime()) / (60 * 60 * 1000);

  if (remainingHours <= 24) {
    return "critical";
  }

  return "healthy";
}

export async function getStaffActivationsOverview(now = new Date()) {
  const [
    awaitingCount,
    awaitingUsers,
    activatedCount,
    revokedCount,
    recentActivationEvents,
  ] = await Promise.all([
    prisma.user.count({
      where: {
        membershipStatus: "awaiting_activation",
      },
    }),
    prisma.user.findMany({
      where: {
        membershipStatus: "awaiting_activation",
      },
      include: {
        activationWindow: true,
      },
      orderBy: [{ activationDeadline: "asc" }],
      take: 16,
    }),
    prisma.activationWindow.count({
      where: {
        activatedAt: { not: null },
      },
    }),
    prisma.activationWindow.count({
      where: {
        revokedAt: { not: null },
      },
    }),
    prisma.auditLog.findMany({
      where: {
        eventType: { in: [...activationAuditEvents] },
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

  const overdueCount = awaitingUsers.filter(
    (user) => classifyActivationWindow(user.activationDeadline, now) === "overdue",
  ).length;

  return {
    awaitingCount,
    overdueCount,
    activatedCount,
    revokedCount,
    awaitingUsers: awaitingUsers.map((user) => ({
      ...user,
      activationHealth: classifyActivationWindow(user.activationDeadline, now),
    })),
    recentActivationEvents,
  };
}
