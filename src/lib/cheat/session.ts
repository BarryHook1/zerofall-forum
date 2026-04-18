// Cheat session helpers: generate token, compute expiry, validate shape.

import { randomBytes, createHash } from "node:crypto";

// 32 random bytes → 256 bits of entropy. Opaque to the client.
export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

// Session lifetime. We refresh expiresAt on every heartbeat so an active
// client always has a fresh session; an idle client expires naturally.
export const SESSION_TTL_SECONDS = 15 * 60;        // 15 min from last heartbeat
export const HEARTBEAT_INTERVAL_MS = 30_000;       // 30 s between heartbeats

export function computeSessionExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + SESSION_TTL_SECONDS * 1000);
}

export function isSessionExpired(session: { expiresAt: Date; revokedAt: Date | null }): boolean {
  if (session.revokedAt) return true;
  return session.expiresAt.getTime() <= Date.now();
}

// HWID sanity check. The C++ client sends a sha256 hex (64 chars lowercase).
// We reject anything else; never trust.
const HWID_PATTERN = /^[0-9a-f]{64}$/;

export function isValidHwid(hwid: string): boolean {
  return HWID_PATTERN.test(hwid);
}

// Short deterministic fingerprint used only for logging (don't store raw HWID
// in logs if the table gets hot). HWID itself IS already a hash but this is
// an extra squeeze for display.
export function hwidShort(hwid: string): string {
  return createHash("sha256").update(hwid).digest("hex").slice(0, 12);
}
