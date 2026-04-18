// cheat-admin-service.ts — admin operations for cheat licensing.
//
// Called by /api/cheat/admin/* routes, which are gated by requireApiPathAccess("/staff").
// All writes are audited via cheat_auth_logs with the actor's user id in `detail`.

import { randomBytes } from "node:crypto";
import type { CheatProduct } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { signOffsetsForStorage } from "@/server/services/cheat/cheat-offsets-service";

function randomLicenseKey(): string {
  return randomBytes(32).toString("hex");
}

// ── Licenses ────────────────────────────────────────────────────────────

export interface ListLicensesFilters {
  status?: "active" | "revoked" | "expired";
  product?: CheatProduct;
  username?: string;
  limit?: number;
}

export async function listLicenses(filters: ListLicensesFilters = {}) {
  return prisma.cheatLicense.findMany({
    where: {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.product ? { product: filters.product } : {}),
      ...(filters.username ? { user: { username: { contains: filters.username, mode: "insensitive" } } } : {}),
    },
    include: {
      user: { select: { id: true, username: true, email: true } },
      hwidBindings: true,
      _count: { select: { sessions: true } },
    },
    orderBy: { createdAt: "desc" },
    take: filters.limit ?? 100,
  });
}

export async function createLicense(args: {
  userId: string;
  product: CheatProduct;
  days: number;
  hwidLimit?: number;
  notes?: string;
}) {
  const expiresAt = new Date(Date.now() + args.days * 24 * 60 * 60 * 1000);
  return prisma.cheatLicense.upsert({
    where: {
      userId_product: { userId: args.userId, product: args.product },
    },
    update: {
      licenseKey: randomLicenseKey(),
      status: "active",
      hwidLimit: args.hwidLimit ?? 2,
      expiresAt,
      revokedAt: null,
      revokeReason: null,
      notes: args.notes ?? null,
    },
    create: {
      userId: args.userId,
      product: args.product,
      licenseKey: randomLicenseKey(),
      status: "active",
      hwidLimit: args.hwidLimit ?? 2,
      expiresAt,
      notes: args.notes ?? null,
    },
  });
}

export async function revokeLicense(args: {
  licenseId: string;
  reason: string;
  actorId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const license = await tx.cheatLicense.update({
      where: { id: args.licenseId },
      data: {
        status: "revoked",
        revokedAt: new Date(),
        revokeReason: args.reason,
      },
    });
    // Kill every active session for this license.
    await tx.cheatSession.updateMany({
      where: { licenseId: args.licenseId, revokedAt: null },
      data: { revokedAt: new Date(), expiresAt: new Date() },
    });
    return license;
  });
}

export async function extendLicense(args: {
  licenseId: string;
  days: number;
}) {
  const license = await prisma.cheatLicense.findUniqueOrThrow({
    where: { id: args.licenseId },
  });
  const base =
    license.expiresAt.getTime() > Date.now()
      ? license.expiresAt
      : new Date();
  const expiresAt = new Date(base.getTime() + args.days * 24 * 60 * 60 * 1000);
  return prisma.cheatLicense.update({
    where: { id: args.licenseId },
    data: {
      expiresAt,
      status: "active",
      revokedAt: null,
      revokeReason: null,
    },
  });
}

export async function removeHwidBinding(bindingId: string) {
  return prisma.cheatHwidBinding.delete({ where: { id: bindingId } });
}

// ── Offsets ─────────────────────────────────────────────────────────────

export async function listOffsetsVersions(product: CheatProduct) {
  return prisma.cheatOffsets.findMany({
    where: { product },
    include: { publishedBy: { select: { id: true, username: true } } },
    orderBy: { version: "desc" },
  });
}

export async function publishOffsets(args: {
  product: CheatProduct;
  data: unknown;
  actorId: string;
  notes?: string;
  activate?: boolean; // defaults true — publishing = going live
}) {
  // Determine next version number atomically.
  return prisma.$transaction(async (tx) => {
    const highest = await tx.cheatOffsets.findFirst({
      where: { product: args.product },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    const nextVersion = (highest?.version ?? 0) + 1;

    // Sign with the server's current key so the stored signature is valid
    // even if a future rotation changes the active key.
    const { keyId, signature } = signOffsetsForStorage({
      product: args.product,
      version: nextVersion,
      data: args.data,
    });

    if (args.activate !== false) {
      // Deactivate all other versions of the same product.
      await tx.cheatOffsets.updateMany({
        where: { product: args.product, active: true },
        data: { active: false },
      });
    }

    return tx.cheatOffsets.create({
      data: {
        product: args.product,
        version: nextVersion,
        offsetsJson: args.data as object,
        signature,
        publicKeyId: keyId,
        publishedById: args.actorId,
        active: args.activate !== false,
        notes: args.notes ?? null,
      },
      include: { publishedBy: { select: { id: true, username: true } } },
    });
  });
}

export async function activateOffsets(args: {
  offsetsId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const target = await tx.cheatOffsets.findUniqueOrThrow({
      where: { id: args.offsetsId },
    });
    await tx.cheatOffsets.updateMany({
      where: { product: target.product, active: true },
      data: { active: false },
    });
    return tx.cheatOffsets.update({
      where: { id: args.offsetsId },
      data: { active: true },
    });
  });
}

// ── Audit ───────────────────────────────────────────────────────────────

export async function listRecentAuthLogs(args: { limit?: number } = {}) {
  return prisma.cheatAuthLog.findMany({
    include: {
      license: {
        include: { user: { select: { id: true, username: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: args.limit ?? 200,
  });
}

export async function listRecentAuthLogsForLicense(
  licenseId: string,
  limit = 100,
) {
  return prisma.cheatAuthLog.findMany({
    where: { licenseId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
