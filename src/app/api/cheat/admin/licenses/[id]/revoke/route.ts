// POST /api/cheat/admin/licenses/[id]/revoke
// body: { reason }
// Flags the license revoked and kills every active session for it.

import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiPathAccess } from "@/lib/permissions/guards";
import { revokeLicense } from "@/server/services/cheat/cheat-admin-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  reason: z.string().min(1).max(200),
});

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

  const license = await revokeLicense({
    licenseId: id,
    reason: parsed.data.reason,
    actorId: auth.session.user.id,
  });

  return NextResponse.json({ id: license.id, status: license.status });
}
