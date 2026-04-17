import { prisma } from "@/lib/db/prisma";

export const rankGuide = [
  {
    code: "verified",
    label: "Verified",
    description: "Core member standing with base private access and active internal status.",
  },
  {
    code: "elite",
    label: "Elite",
    description: "Elevated member standing for retained participation and stronger internal trust.",
  },
  {
    code: "vanguard",
    label: "Vanguard",
    description: "High-prestige standing reserved for members with stronger continuity and visibility.",
  },
  {
    code: "genesis_founder",
    label: "Genesis Founder",
    description: "Founding entry standing tied to original Genesis admission and earliest UID issuance.",
  },
] as const;

export function buildMemberMilestones(user: {
  entryStatus: string;
  forumUid: number | null;
  membershipStatus: string;
  discordId: string | null;
  badgeStatus: string;
}) {
  return [
    {
      label: "Genesis Entry Confirmed",
      reached: user.entryStatus === "entry_confirmed",
    },
    {
      label: "UID Issued",
      reached: Boolean(user.forumUid),
    },
    {
      label: "Membership Active",
      reached: user.membershipStatus === "active",
    },
    {
      label: "Discord Linked",
      reached: Boolean(user.discordId),
    },
    {
      label: "Badge Enabled",
      reached: user.badgeStatus === "enabled",
    },
  ];
}

export async function getMemberStatusOverview(userId: string) {
  const [user, rankDistribution, recentUidRegistry] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        activationWindow: true,
        ranks: {
          orderBy: { grantedAt: "desc" },
          take: 12,
        },
        badges: {
          orderBy: { grantedAt: "desc" },
          take: 12,
        },
        auditLogs: {
          orderBy: { createdAt: "desc" },
          take: 16,
        },
      },
    }),
    prisma.user.groupBy({
      by: ["rank"],
      _count: { _all: true },
    }),
    prisma.user.findMany({
      where: {
        forumUid: { not: null },
      },
      select: {
        id: true,
        username: true,
        forumUid: true,
        rank: true,
        createdAt: true,
      },
      orderBy: [{ forumUid: "desc" }],
      take: 12,
    }),
  ]);

  const distribution = {
    none: 0,
    verified: 0,
    elite: 0,
    vanguard: 0,
    genesis_founder: 0,
  };

  for (const row of rankDistribution) {
    distribution[row.rank] = row._count._all;
  }

  const milestones = buildMemberMilestones(user);

  return {
    user,
    rankGuide,
    rankDistribution: distribution,
    recentUidRegistry,
    milestones,
  };
}
