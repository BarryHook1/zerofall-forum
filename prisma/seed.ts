import "dotenv/config";

import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

type SeedStaffUser = {
  username: string;
  email: string;
  password: string;
  accountRole:
    | "founder"
    | "admin"
    | "operations"
    | "billing"
    | "moderator"
    | "support";
  rank?: "none" | "verified" | "elite" | "vanguard" | "genesis_founder";
  badgeStatus?: "disabled" | "enabled";
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

function parseSeedStaffUsers(): SeedStaffUser[] {
  const raw = process.env.ZEROFALL_SEED_STAFF_JSON;
  if (!raw) {
    return [];
  }

  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("ZEROFALL_SEED_STAFF_JSON must be a JSON array");
  }

  return parsed.map((entry) => {
    if (
      !entry ||
      typeof entry !== "object" ||
      typeof entry.username !== "string" ||
      typeof entry.email !== "string" ||
      typeof entry.password !== "string" ||
      typeof entry.accountRole !== "string"
    ) {
      throw new Error("Each staff seed entry requires username, email, password, and accountRole");
    }

    return {
      username: entry.username.trim(),
      email: entry.email.trim().toLowerCase(),
      password: entry.password,
      accountRole: entry.accountRole,
      rank: entry.rank ?? (entry.accountRole === "founder" ? "genesis_founder" : "none"),
      badgeStatus: entry.badgeStatus ?? "enabled",
    } satisfies SeedStaffUser;
  });
}

async function issueNextForumUid(prisma: PrismaClient) {
  const current = await prisma.uidSequence.findUniqueOrThrow({
    where: { name: "forum_uid" },
  });
  const nextValue = current.currentValue + 1;
  await prisma.uidSequence.update({
    where: { name: "forum_uid" },
    data: { currentValue: nextValue },
  });
  return nextValue;
}

async function seedStaffUsers(prisma: PrismaClient) {
  const staffUsers = parseSeedStaffUsers();

  for (const staffUser of staffUsers) {
    const existing = await prisma.user.findUnique({
      where: { email: staffUser.email },
    });
    const passwordHash = await hash(staffUser.password, 10);
    const forumUid = existing?.forumUid ?? (await issueNextForumUid(prisma));

    await prisma.user.upsert({
      where: { email: staffUser.email },
      update: {
        username: staffUser.username,
        passwordHash,
        forumUid,
        accountRole: staffUser.accountRole,
        entryStatus: "entry_confirmed",
        membershipStatus: "active",
        rank: staffUser.rank,
        badgeStatus: staffUser.badgeStatus,
      },
      create: {
        username: staffUser.username,
        email: staffUser.email,
        passwordHash,
        forumUid,
        accountRole: staffUser.accountRole,
        entryStatus: "entry_confirmed",
        membershipStatus: "active",
        rank: staffUser.rank,
        badgeStatus: staffUser.badgeStatus,
      },
    });
  }
}

async function main() {
  const prisma = createPrismaClient();

  try {
    await prisma.uidSequence.upsert({
      where: { name: "forum_uid" },
      update: {},
      create: {
        name: "forum_uid",
        currentValue: 0,
      },
    });

    await seedStaffUsers(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
