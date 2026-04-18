// Ed25519 signing / verification helpers.
//
// Keys live in env vars as raw 32-byte base64:
//   CHEAT_OFFSETS_ED25519_PRIVATE_KEY_B64   (server only)
//   CHEAT_OFFSETS_ED25519_PUBLIC_KEY_B64    (shared; also embedded in client)
//   CHEAT_OFFSETS_ED25519_KEY_ID            (string id for rotation, e.g. "v1")
//
// Use generate-ed25519-keys.ts to produce them.

import { createPrivateKey, createPublicKey, sign, verify } from "node:crypto";

let cachedPrivateKey: ReturnType<typeof createPrivateKey> | null = null;
let cachedPublicKey: ReturnType<typeof createPublicKey> | null = null;
let cachedKeyId: string | null = null;

// Wrap a raw 32-byte Ed25519 key in the PKCS#8 / SPKI envelope Node requires.
const PKCS8_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");
const SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

function loadPrivateKey() {
  if (cachedPrivateKey) return cachedPrivateKey;
  const b64 = process.env.CHEAT_OFFSETS_ED25519_PRIVATE_KEY_B64;
  if (!b64) throw new Error("CHEAT_OFFSETS_ED25519_PRIVATE_KEY_B64 is not set");
  const raw = Buffer.from(b64, "base64");
  if (raw.length !== 32) throw new Error("private key must be exactly 32 bytes");
  cachedPrivateKey = createPrivateKey({
    key: Buffer.concat([PKCS8_PREFIX, raw]),
    format: "der",
    type: "pkcs8",
  });
  return cachedPrivateKey;
}

function loadPublicKey() {
  if (cachedPublicKey) return cachedPublicKey;
  const b64 = process.env.CHEAT_OFFSETS_ED25519_PUBLIC_KEY_B64;
  if (!b64) throw new Error("CHEAT_OFFSETS_ED25519_PUBLIC_KEY_B64 is not set");
  const raw = Buffer.from(b64, "base64");
  if (raw.length !== 32) throw new Error("public key must be exactly 32 bytes");
  cachedPublicKey = createPublicKey({
    key: Buffer.concat([SPKI_PREFIX, raw]),
    format: "der",
    type: "spki",
  });
  return cachedPublicKey;
}

export function getOffsetsKeyId(): string {
  if (cachedKeyId) return cachedKeyId;
  cachedKeyId = process.env.CHEAT_OFFSETS_ED25519_KEY_ID ?? "v1";
  return cachedKeyId;
}

/// Sign an arbitrary Buffer with the server private key. Returns base64.
export function signBytes(data: Buffer): string {
  const key = loadPrivateKey();
  const sig = sign(null, data, key); // null algo = Ed25519 requires null
  return sig.toString("base64");
}

/// Verify a base64-encoded signature. Useful in tests.
export function verifyBytes(data: Buffer, signatureB64: string): boolean {
  const key = loadPublicKey();
  const sig = Buffer.from(signatureB64, "base64");
  return verify(null, data, key, sig);
}

/// Canonical JSON encoding: keys sorted recursively, no whitespace.
/// Produces the exact same bytes on server and client so signatures match.
/// The C++ client re-creates this canonical form before verifying.
export function canonicalJsonBytes(value: unknown): Buffer {
  return Buffer.from(canonicalize(value), "utf8");
}

function canonicalize(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("non-finite number in canonical JSON");
    return String(value);
  }
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalize).join(",") + "]";
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalize(obj[k])).join(",") + "}";
  }
  throw new Error(`unsupported value in canonical JSON: ${typeof value}`);
}
