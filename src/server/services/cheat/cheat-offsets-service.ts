// cheat-offsets-service.ts — fetch + sign the currently active offsets row.
//
// A signed offsets payload is what the C++ client TRUSTS. Even if an
// attacker patches the client to accept any server response, they can't
// forge the Ed25519 signature without the private key.

import type { CheatProduct } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  canonicalJsonBytes,
  getOffsetsKeyId,
  signBytes,
} from "@/lib/cheat/signing";

export interface SignedOffsetsPayload {
  product: CheatProduct;
  version: number;
  keyId: string;
  // `data` is the raw offsets JSON as published by the admin. Deliberately
  // passed through as-is so the client can canonicalize it identically.
  data: unknown;
  // Ed25519 signature over canonical({product, version, keyId, data}).
  signature: string;
}

export async function getActiveSignedOffsets(
  product: CheatProduct,
): Promise<SignedOffsetsPayload | null> {
  const row = await prisma.cheatOffsets.findFirst({
    where: { product, active: true },
    orderBy: { version: "desc" },
  });
  if (!row) return null;

  // Keep the signed payload SHAPE identical on server + client so the
  // canonicalized bytes match exactly. Don't add fields without updating
  // both sides.
  const unsigned = {
    product: row.product,
    version: row.version,
    keyId: row.publicKeyId,
    data: row.offsetsJson,
  };

  // Resign on every fetch (cheap) so the signature always uses the current
  // server private key. If you rotate the key and store offsets with the
  // old keyId, the mismatch is explicit in the payload.
  const signature = signBytes(canonicalJsonBytes(unsigned));

  return { ...unsigned, signature };
}

// Convenience: when publishing a new offsets row from the admin UI, we
// store the signature alongside it so the C++ client could validate offline
// caches too (future use). Shared canonical form ensures consistency.
export function signOffsetsForStorage(args: {
  product: CheatProduct;
  version: number;
  data: unknown;
}): { signature: string; keyId: string } {
  const keyId = getOffsetsKeyId();
  const payload = {
    product: args.product,
    version: args.version,
    keyId,
    data: args.data,
  };
  return { keyId, signature: signBytes(canonicalJsonBytes(payload)) };
}
