// POST /api/cheat/admin/offsets/[id]/activate
// Swap the active offsets row for this product to the one with id=[id].
// Prior active row is deactivated (history preserved).

import { NextResponse } from "next/server";

import { requireApiPathAccess } from "@/lib/permissions/guards";
import { activateOffsets } from "@/server/services/cheat/cheat-admin-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiPathAccess("/staff");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const row = await activateOffsets({ offsetsId: id });
  return NextResponse.json({
    id: row.id,
    version: row.version,
    active: row.active,
  });
}
