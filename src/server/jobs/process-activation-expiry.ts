import { prisma } from "@/lib/db/prisma";
import { StaffService } from "@/server/services/staff-service";

export async function processActivationExpiryJob(now = new Date()) {
  const expiredUsers = await prisma.user.findMany({
    where: {
      membershipStatus: "awaiting_activation",
      activationDeadline: { lte: now },
    },
  });
  const staffService = new StaffService();

  for (const user of expiredUsers) {
    await staffService.revokeUser(user.id);
  }

  return expiredUsers.length;
}
