// POST /api/cheat/auth/login
// body: { username, password, hwid, product? }
// 200: { ok: true, sessionToken, expiresAt, heartbeatMs }
// 4xx: { ok: false, error: CheatErrorCode }

import { NextResponse } from "next/server";
import { z } from "zod";

import { CHEAT_ERRORS } from "@/lib/cheat/errors";
import {
  LOGIN_RATE_LIMIT,
  rateLimitByIp,
} from "@/lib/cheat/rate-limit";
import { login } from "@/server/services/cheat/cheat-auth-service";

export const runtime = "nodejs";           // Ed25519 needs node:crypto, not edge
export const dynamic = "force-dynamic";    // never cache

const BodySchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(256),
  hwid: z.string().regex(/^[0-9a-f]{64}$/),
  product: z.enum(["valhalla"]).default("valhalla"),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const ua = req.headers.get("user-agent") ?? undefined;

  const rl = rateLimitByIp(ip, LOGIN_RATE_LIMIT.maxAttempts, LOGIN_RATE_LIMIT.windowMs);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: CHEAT_ERRORS.RATE_LIMITED },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetInMs / 1000)) } },
    );
  }

  let body: z.infer<typeof BodySchema>;
  try {
    const raw = await req.json();
    body = BodySchema.parse(raw);
  } catch {
    return NextResponse.json(
      { ok: false, error: CHEAT_ERRORS.BAD_REQUEST },
      { status: 400 },
    );
  }

  const result = await login({
    ...body,
    ipAddress: ip,
    userAgent: ua,
  });

  if (!result.ok) {
    const status = statusForError(result.error);
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result, { status: 200 });
}

function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

function statusForError(code: string): number {
  switch (code) {
    case CHEAT_ERRORS.INVALID_CREDENTIALS:
    case CHEAT_ERRORS.INVALID_SESSION:
    case CHEAT_ERRORS.HWID_MISMATCH:
      return 401;
    case CHEAT_ERRORS.NO_LICENSE:
    case CHEAT_ERRORS.LICENSE_REVOKED:
    case CHEAT_ERRORS.LICENSE_EXPIRED:
    case CHEAT_ERRORS.HWID_LIMIT_REACHED:
      return 403;
    case CHEAT_ERRORS.RATE_LIMITED:
      return 429;
    case CHEAT_ERRORS.BAD_REQUEST:
      return 400;
    default:
      return 500;
  }
}
