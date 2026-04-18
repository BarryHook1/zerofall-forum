// POST /api/cheat/admin/licenses/[id]/extend
// body: { days }
// Bumps expiresAt by N days. Reactivates if expired/revoked.

import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiPathAccess } from "@/lib/permissions/guards";
import { extendLicense } from "@/server/services/cheat/cheat-admin-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({ days: z.number().int().min(1).max(3650) });

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiPathAccess("/staff");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const license = await extendLicense({
    licenseId: id,
    days: parsed.data.days,
  });
  return NextResponse.json({
    id: license.id,
    status: license.status,
    expiresAt: license.expiresAt,
  });
}
