// POST /api/cheat/auth/logout
// body: { sessionToken }
// 200: { ok: true }   (always — idempotent)

import { NextResponse } from "next/server";
import { z } from "zod";

import { logout } from "@/server/services/cheat/cheat-auth-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  sessionToken: z.string().min(1).max(256),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);

  let body: z.infer<typeof BodySchema>;
  try {
    const raw = await req.json();
    body = BodySchema.parse(raw);
  } catch {
    return NextResponse.json({ ok: true });
  }

  await logout({ sessionToken: body.sessionToken, ipAddress: ip });
  return NextResponse.json({ ok: true });
}

function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
