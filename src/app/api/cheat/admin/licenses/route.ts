// GET  /api/cheat/admin/licenses         — list licenses
// POST /api/cheat/admin/licenses         — create or rotate license
//   body: { username | userId, days, hwidLimit?, notes? }
// Staff-only (requireApiPathAccess("/staff")).

import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { requireApiPathAccess } from "@/lib/permissions/guards";
import {
  createLicense,
  listLicenses,
} from "@/server/services/cheat/cheat-admin-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CreateSchema = z
  .object({
    username: z.string().min(1).max(64).optional(),
    userId: z.string().uuid().optional(),
    product: z.enum(["valhalla"]).default("valhalla"),
    days: z.number().int().min(1).max(3650),
    hwidLimit: z.number().int().min(1).max(10).optional(),
    notes: z.string().max(500).optional(),
  })
  .refine((v) => v.username || v.userId, {
    message: "username or userId required",
  });

export async function GET(req: Request) {
  const auth = await requireApiPathAccess("/staff");
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") as
    | "active"
    | "revoked"
    | "expired"
    | null;
  const username = url.searchParams.get("username") ?? undefined;

  const rows = await listLicenses({
    status: status ?? undefined,
    username,
    limit: 200,
  });

  return NextResponse.json({
    licenses: rows.map((l) => ({
      id: l.id,
      user: l.user,
      product: l.product,
      status: l.status,
      hwidLimit: l.hwidLimit,
      bindings: l.hwidBindings.length,
      sessions: l._count.sessions,
      expiresAt: l.expiresAt,
      revokedAt: l.revokedAt,
      notes: l.notes,
      createdAt: l.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const auth = await requireApiPathAccess("/staff");
  if (!auth.ok) return auth.response;

  const parsed = CreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const input = parsed.data;

  let userId = input.userId;
  if (!userId && input.username) {
    const user = await prisma.user.findUnique({
      where: { username: input.username.trim() },
    });
    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }
    userId = user.id;
  }

  const license = await createLicense({
    userId: userId!,
    product: input.product,
    days: input.days,
    hwidLimit: input.hwidLimit,
    notes: input.notes,
  });

  return NextResponse.json(
    {
      id: license.id,
      licenseKey: license.licenseKey,
      product: license.product,
      status: license.status,
      expiresAt: license.expiresAt,
      hwidLimit: license.hwidLimit,
    },
    { status: 201 },
  );
}
