import { prisma } from "@/lib/db/prisma";

export function parseForumUidQuery(query: string) {
  const normalized = query.trim().replace(/^#/, "");

  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  const uid = Number.parseInt(normalized, 10);
  return Number.isFinite(uid) && uid > 0 ? uid : null;
}

export function normalizeMemberSearchQuery(query: string | string[] | undefined) {
  const raw = Array.isArray(query) ? query[0] : query;
  return raw?.trim() ?? "";
}

export async function getStaffMembersOverview(query: string) {
  const normalizedQuery = query.trim();
  const forumUid = parseForumUidQuery(normalizedQuery);
  const conditions = [
    ...(forumUid ? [{ forumUid }] : []),
    { username: { contains: normalizedQuery, mode: "insensitive" as const } },
    { email: { contains: normalizedQuery, mode: "insensitive" as const } },
  ];

  const users = normalizedQuery
    ? await prisma.user.findMany({
        where: {
          OR: conditions,
        },
        include: {
          ranks: {
            orderBy: { grantedAt: "desc" },
            take: 5,
          },
          auditLogs: {
            orderBy: { createdAt: "desc" },
            take: 6,
          },
        },
        orderBy: [{ updatedAt: "desc" }],
        take: 20,
      })
    : [];

  return {
    query: normalizedQuery,
    users,
  };
}
