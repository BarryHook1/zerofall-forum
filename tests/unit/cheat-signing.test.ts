// Unit tests for cheat signing + canonical JSON helpers.
// These don't need a database — they only exercise the crypto/env layer.

import { beforeAll, describe, expect, it } from "vitest";
import { generateKeyPairSync } from "node:crypto";

describe("cheat signing", () => {
  beforeAll(() => {
    // Produce a fresh keypair for this test run so we don't depend on real env.
    const { publicKey, privateKey } = generateKeyPairSync("ed25519");
    const rawPrivate = privateKey.export({ format: "der", type: "pkcs8" }).slice(-32);
    const rawPublic = publicKey.export({ format: "der", type: "spki" }).slice(-32);
    process.env.CHEAT_OFFSETS_ED25519_PRIVATE_KEY_B64 = rawPrivate.toString("base64");
    process.env.CHEAT_OFFSETS_ED25519_PUBLIC_KEY_B64 = rawPublic.toString("base64");
    process.env.CHEAT_OFFSETS_ED25519_KEY_ID = "test-v1";
  });

  it("canonical JSON is deterministic regardless of key order", async () => {
    const { canonicalJsonBytes } = await import("@/lib/cheat/signing");
    const a = canonicalJsonBytes({ product: "valhalla", version: 1, data: { b: 2, a: 1 } });
    const b = canonicalJsonBytes({ data: { a: 1, b: 2 }, version: 1, product: "valhalla" });
    expect(a.toString()).toEqual(b.toString());
  });

  it("canonical JSON encodes primitives + nested structures", async () => {
    const { canonicalJsonBytes } = await import("@/lib/cheat/signing");
    const bytes = canonicalJsonBytes({
      s: "hi",
      n: 42,
      b: true,
      nil: null,
      arr: [3, 1, 2],
      obj: { z: 1, a: { y: 2, x: 1 } },
    });
    // Keys sorted at every level, no whitespace.
    expect(bytes.toString()).toEqual(
      '{"arr":[3,1,2],"b":true,"n":42,"nil":null,"obj":{"a":{"x":1,"y":2},"z":1},"s":"hi"}',
    );
  });

  it("sign then verify round-trips", async () => {
    const { canonicalJsonBytes, signBytes, verifyBytes } = await import("@/lib/cheat/signing");
    const payload = canonicalJsonBytes({ product: "valhalla", version: 7, data: { a: 1 } });
    const sig = signBytes(payload);
    expect(verifyBytes(payload, sig)).toBe(true);
  });

  it("verify fails when payload is tampered", async () => {
    const { canonicalJsonBytes, signBytes, verifyBytes } = await import("@/lib/cheat/signing");
    const original = canonicalJsonBytes({ product: "valhalla", version: 7, data: { a: 1 } });
    const sig = signBytes(original);
    const tampered = canonicalJsonBytes({ product: "valhalla", version: 7, data: { a: 2 } });
    expect(verifyBytes(tampered, sig)).toBe(false);
  });

  it("signature is stable for same input", async () => {
    const { canonicalJsonBytes, signBytes } = await import("@/lib/cheat/signing");
    const payload = canonicalJsonBytes({ product: "valhalla", version: 1, data: { x: 1 } });
    expect(signBytes(payload)).toEqual(signBytes(payload));
  });
});
