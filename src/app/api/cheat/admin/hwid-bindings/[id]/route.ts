// DELETE /api/cheat/admin/hwid-bindings/[id]
// Unbinds a HWID slot from its license. User can re-bind on next login.

import { NextResponse } from "next/server";

import { requireApiPathAccess } from "@/lib/permissions/guards";
import { removeHwidBinding } from "@/server/services/cheat/cheat-admin-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiPathAccess("/staff");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  await removeHwidBinding(id);
  return NextResponse.json({ ok: true });
}
