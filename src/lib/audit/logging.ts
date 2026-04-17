import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

type AuditInput = {
  userId?: string | null;
  actorId?: string | null;
  eventType: string;
  meta: Prisma.InputJsonValue;
};

export async function createAuditLog({
  userId = null,
  actorId = null,
  eventType,
  meta,
}: AuditInput) {
  return prisma.auditLog.create({
    data: {
      userId,
      actorId,
      eventType,
      metaJson: meta,
    },
  });
}
