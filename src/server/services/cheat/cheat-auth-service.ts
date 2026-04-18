// cheat-auth-service.ts — login, heartbeat, logout for the C++ loader.
//
// NOT the same surface as the website's NextAuth. This is a purpose-built
// flow for a long-running external client:
//   - Inputs always include `hwid`. HWID is enforced per-license.
//   - Sessions are opaque random tokens stored in cheat_sessions.
//   - Heartbeat refreshes session expiry AND returns a signed offsets
//     payload the client trusts more than the transport.
//
// All write paths record an entry in cheat_auth_logs.

import { compare } from "bcryptjs";
import type { CheatProduct } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { CHEAT_ERRORS, type CheatErrorCode } from "@/lib/cheat/errors";
import {
  computeSessionExpiry,
  generateSessionToken,
  HEARTBEAT_INTERVAL_MS,
  isSessionExpired,
  isValidHwid,
} from "@/lib/cheat/session";
import { getActiveSignedOffsets, type SignedOffsetsPayload } from "@/server/services/cheat/cheat-offsets-service";

// Limit the size of `username` / `password` inputs we even consider.
const MAX_USERNAME = 64;
const MAX_PASSWORD = 256;

export interface LoginInput {
  username: string;
  password: string;
  hwid: string;
  product: CheatProduct;
  ipAddress?: string;
  userAgent?: string;
}

export interface ProfileSnapshot {
  user: {
    username: string;
    uid: number | null;   // forumUid, zero-padded client-side
    rank: string;
  };
  license: {
    expiresAt: Date;
    hwidsBound: number;
    hwidLimit: number;
  };
}

export interface LoginSuccess extends ProfileSnapshot {
  ok: true;
  sessionToken: string;
  expiresAt: Date;
  heartbeatMs: number;
}

export interface CheatError {
  ok: false;
  error: CheatErrorCode;
}

export type LoginResult = LoginSuccess | CheatError;

export async function login(input: LoginInput): Promise<LoginResult> {
  const username = input.username.trim();
  if (
    !username ||
    username.length > MAX_USERNAME ||
    !input.password ||
    input.password.length > MAX_PASSWORD ||
    !isValidHwid(input.hwid)
  ) {
    await recordAuth({
      event: "login",
      outcome: "server_error",
      username: username || null,
      hwid: input.hwid ?? null,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      detail: "malformed_input",
    });
    return { ok: false, error: CHEAT_ERRORS.BAD_REQUEST };
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    await recordAuth({
      event: "login",
      outcome: "bad_password",
      username,
      hwid: input.hwid,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
    // Same generic error as bad password so the client can't enumerate users.
    return { ok: false, error: CHEAT_ERRORS.INVALID_CREDENTIALS };
  }

  const passwordOk = await compare(input.password, user.passwordHash);
  if (!passwordOk) {
    await recordAuth({
      event: "login",
      outcome: "bad_password",
      username,
      hwid: input.hwid,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
    return { ok: false, error: CHEAT_ERRORS.INVALID_CREDENTIALS };
  }

  const license = await prisma.cheatLicense.findUnique({
    where: { userId_product: { userId: user.id, product: input.product } },
    include: { hwidBindings: true },
  });

  if (!license) {
    await recordAuth({
      event: "login",
      outcome: "no_license",
      username,
      hwid: input.hwid,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
    return { ok: false, error: CHEAT_ERRORS.NO_LICENSE };
  }

  if (license.status === "revoked") {
    await recordAuth({
      event: "login",
      outcome: "license_revoked",
      licenseId: license.id,
      username,
      hwid: input.hwid,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
    return { ok: false, error: CHEAT_ERRORS.LICENSE_REVOKED };
  }

  if (license.status === "expired" || license.expiresAt.getTime() <= Date.now()) {
    await recordAuth({
      event: "login",
      outcome: "license_expired",
      licenseId: license.id,
      username,
      hwid: input.hwid,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
    // Flip status so it's visible in the admin UI without a batch job.
    if (license.status !== "expired") {
      await prisma.cheatLicense.update({
        where: { id: license.id },
        data: { status: "expired" },
      });
    }
    return { ok: false, error: CHEAT_ERRORS.LICENSE_EXPIRED };
  }

  // HWID binding: upsert current HWID; reject if the license is already at
  // its slot limit AND this HWID isn't one of them.
  const existingBinding = license.hwidBindings.find((b) => b.hwid === input.hwid);
  if (!existingBinding && license.hwidBindings.length >= license.hwidLimit) {
    await recordAuth({
      event: "login",
      outcome: "hwid_limit_reached",
      licenseId: license.id,
      username,
      hwid: input.hwid,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
    return { ok: false, error: CHEAT_ERRORS.HWID_LIMIT_REACHED };
  }

  if (existingBinding) {
    await prisma.cheatHwidBinding.update({
      where: { id: existingBinding.id },
      data: { lastSeenAt: new Date(), lastIp: input.ipAddress ?? null },
    });
  } else {
    await prisma.cheatHwidBinding.create({
      data: {
        licenseId: license.id,
        hwid: input.hwid,
        lastIp: input.ipAddress ?? null,
      },
    });
  }

  // All clear — issue a session.
  const now = new Date();
  const expiresAt = computeSessionExpiry(now);
  const sessionToken = generateSessionToken();

  await prisma.cheatSession.create({
    data: {
      sessionToken,
      licenseId: license.id,
      hwid: input.hwid,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      createdAt: now,
      lastHeartbeatAt: now,
      expiresAt,
    },
  });

  await recordAuth({
    event: "login",
    outcome: "success",
    licenseId: license.id,
    username,
    hwid: input.hwid,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });

  // Count includes the binding we just wrote above.
  const hwidsBound = existingBinding
    ? license.hwidBindings.length
    : license.hwidBindings.length + 1;

  return {
    ok: true,
    sessionToken,
    expiresAt,
    heartbeatMs: HEARTBEAT_INTERVAL_MS,
    user: {
      username: user.username,
      uid: user.forumUid,
      rank: user.rank,
    },
    license: {
      expiresAt: license.expiresAt,
      hwidsBound,
      hwidLimit: license.hwidLimit,
    },
  };
}

export interface HeartbeatInput {
  sessionToken: string;
  hwid: string;
  product: CheatProduct;
  ipAddress?: string;
}

export interface HeartbeatSuccess {
  ok: true;
  expiresAt: Date;
  nextHeartbeatMs: number;
  offsets: SignedOffsetsPayload;
}

export type HeartbeatResult = HeartbeatSuccess | CheatError;

export async function heartbeat(input: HeartbeatInput): Promise<HeartbeatResult> {
  if (!input.sessionToken || !isValidHwid(input.hwid)) {
    return { ok: false, error: CHEAT_ERRORS.BAD_REQUEST };
  }

  const session = await prisma.cheatSession.findUnique({
    where: { sessionToken: input.sessionToken },
    include: { license: true },
  });

  if (!session) {
    await recordAuth({
      event: "heartbeat",
      outcome: "invalid_session",
      hwid: input.hwid,
      ipAddress: input.ipAddress,
    });
    return { ok: false, error: CHEAT_ERRORS.INVALID_SESSION };
  }

  if (session.hwid !== input.hwid) {
    // Someone is replaying the token from a different machine.
    await recordAuth({
      event: "heartbeat",
      outcome: "hwid_mismatch",
      licenseId: session.licenseId,
      hwid: input.hwid,
      ipAddress: input.ipAddress,
      detail: `session_hwid_prefix=${session.hwid.slice(0, 8)}`,
    });
    return { ok: false, error: CHEAT_ERRORS.HWID_MISMATCH };
  }

  if (isSessionExpired(session)) {
    await recordAuth({
      event: "heartbeat",
      outcome: "invalid_session",
      licenseId: session.licenseId,
      hwid: input.hwid,
      ipAddress: input.ipAddress,
      detail: "expired",
    });
    return { ok: false, error: CHEAT_ERRORS.SESSION_EXPIRED };
  }

  // License still valid at this moment?
  if (
    session.license.status !== "active" ||
    session.license.expiresAt.getTime() <= Date.now()
  ) {
    await recordAuth({
      event: "heartbeat",
      outcome:
        session.license.status === "revoked" ? "license_revoked" : "license_expired",
      licenseId: session.licenseId,
      hwid: input.hwid,
      ipAddress: input.ipAddress,
    });
    return {
      ok: false,
      error:
        session.license.status === "revoked"
          ? CHEAT_ERRORS.LICENSE_REVOKED
          : CHEAT_ERRORS.LICENSE_EXPIRED,
    };
  }

  const offsets = await getActiveSignedOffsets(session.license.product);
  if (!offsets) {
    await recordAuth({
      event: "heartbeat",
      outcome: "server_error",
      licenseId: session.licenseId,
      hwid: input.hwid,
      ipAddress: input.ipAddress,
      detail: "no_active_offsets",
    });
    return { ok: false, error: CHEAT_ERRORS.OFFSETS_UNAVAILABLE };
  }

  const now = new Date();
  const expiresAt = computeSessionExpiry(now);
  await prisma.cheatSession.update({
    where: { id: session.id },
    data: {
      lastHeartbeatAt: now,
      expiresAt,
      ipAddress: input.ipAddress ?? session.ipAddress,
    },
  });

  await recordAuth({
    event: "heartbeat",
    outcome: "success",
    licenseId: session.licenseId,
    hwid: input.hwid,
    ipAddress: input.ipAddress,
  });

  return {
    ok: true,
    expiresAt,
    nextHeartbeatMs: HEARTBEAT_INTERVAL_MS,
    offsets,
  };
}

export interface LogoutInput {
  sessionToken: string;
  ipAddress?: string;
}

export async function logout(input: LogoutInput): Promise<{ ok: true }> {
  if (!input.sessionToken) return { ok: true };
  const session = await prisma.cheatSession.findUnique({
    where: { sessionToken: input.sessionToken },
  });
  if (!session) return { ok: true };

  await prisma.cheatSession.update({
    where: { id: session.id },
    data: { revokedAt: new Date(), expiresAt: new Date() },
  });

  await recordAuth({
    event: "logout",
    outcome: "success",
    licenseId: session.licenseId,
    hwid: session.hwid,
    ipAddress: input.ipAddress,
  });

  return { ok: true };
}

// ── helpers ─────────────────────────────────────────────────────────────

interface RecordAuthInput {
  event: "login" | "heartbeat" | "logout" | "download";
  outcome:
    | "success"
    | "bad_password"
    | "no_license"
    | "license_revoked"
    | "license_expired"
    | "hwid_mismatch"
    | "hwid_limit_reached"
    | "rate_limited"
    | "invalid_session"
    | "signature_invalid"
    | "server_error";
  licenseId?: string;
  username?: string | null;
  hwid?: string | null;
  ipAddress?: string | null | undefined;
  userAgent?: string | null | undefined;
  detail?: string;
}

async function recordAuth(input: RecordAuthInput) {
  try {
    await prisma.cheatAuthLog.create({
      data: {
        event: input.event,
        outcome: input.outcome,
        licenseId: input.licenseId ?? null,
        username: input.username ?? null,
        hwid: input.hwid ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        detail: input.detail ?? null,
      },
    });
  } catch (err) {
    // Logging must never crash the auth flow.
    console.error("[cheat-auth] failed to write audit log", err);
  }
}
