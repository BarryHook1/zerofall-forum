// GET /api/cheat/me — returns the caller's license state for /cheat page.
// Uses the website NextAuth session, not the loader's session.

import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { getAppSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAppSession();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const licenses = await prisma.cheatLicense.findMany({
    where: { userId: session.user.id },
    include: { hwidBindings: true },
  });

  const now = Date.now();
  const payload = licenses.map((l) => ({
    product: l.product,
    status: l.status,
    expiresAt: l.expiresAt,
    hwidLimit: l.hwidLimit,
    hwidBound: l.hwidBindings.length,
    canUse:
      l.status === "active" &&
      l.expiresAt.getTime() > now &&
      !l.revokedAt,
  }));

  return NextResponse.json({ ok: true, licenses: payload });
}
