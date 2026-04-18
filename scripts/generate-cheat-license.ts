// Generate a CheatLicense for a user.
//
// Usage:
//   DATABASE_URL=... npx tsx scripts/generate-cheat-license.ts <username> [days]
//
// Examples:
//   npx tsx scripts/generate-cheat-license.ts cenky         # 30 days
//   npx tsx scripts/generate-cheat-license.ts cenky 365     # 1 year
//
// Outputs the license_key + expiry. The user can now log in through the
// loader. If a license already exists for that user + product, it's rotated
// (key replaced, expiry reset).

import "dotenv/config";
import { randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const PRODUCT = "valhalla" as const;
const DEFAULT_DAYS = 30;

function randomLicenseKey(): string {
  // 32 bytes → 64 hex chars. Opaque, unguessable.
  return randomBytes(32).toString("hex");
}

async function main() {
  const [usernameArg, daysArg] = process.argv.slice(2);
  if (!usernameArg) {
    console.error("usage: generate-cheat-license.ts <username> [days]");
    process.exit(1);
  }
  const days = Number(daysArg ?? DEFAULT_DAYS);
  if (!Number.isFinite(days) || days <= 0) {
    console.error(`invalid days: ${daysArg}`);
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const user = await prisma.user.findUnique({ where: { username: usernameArg } });
    if (!user) {
      console.error(`user not found: ${usernameArg}`);
      process.exit(1);
    }

    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const licenseKey = randomLicenseKey();

    const license = await prisma.cheatLicense.upsert({
      where: { userId_product: { userId: user.id, product: PRODUCT } },
      update: {
        licenseKey,
        status: "active",
        expiresAt,
        revokedAt: null,
        revokeReason: null,
      },
      create: {
        userId: user.id,
        product: PRODUCT,
        licenseKey,
        status: "active",
        expiresAt,
      },
    });

    console.log(JSON.stringify(
      {
        user: user.username,
        product: PRODUCT,
        licenseKey: license.licenseKey,
        expiresAt: license.expiresAt,
        hwidLimit: license.hwidLimit,
      },
      null,
      2,
    ));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
