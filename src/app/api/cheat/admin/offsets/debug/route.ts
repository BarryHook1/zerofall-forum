// GET /api/cheat/admin/offsets/debug?product=valhalla
//
// Admin-only diagnostic: returns the exact canonical bytes the server
// signed for the currently-active offsets row, plus the signature and
// the public key in hex. Use this to diff against the C++ client's
// vh_canonical_debug.txt when signature verification fails.

import { NextResponse } from "next/server";

import { requireApiPathAccess } from "@/lib/permissions/guards";
import {
  canonicalJsonBytes,
  getOffsetsKeyId,
  signBytes,
} from "@/lib/cheat/signing";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireApiPathAccess("/staff");
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const product =
    (url.searchParams.get("product") as "valhalla" | null) ?? "valhalla";

  const row = await prisma.cheatOffsets.findFirst({
    where: { product, active: true },
    orderBy: { version: "desc" },
  });
  if (!row) {
    return NextResponse.json({ error: "no_active_offsets" }, { status: 404 });
  }

  const payload = {
    product: row.product,
    version: row.version,
    keyId: row.publicKeyId,
    data: row.offsetsJson,
  };
  const bytes = canonicalJsonBytes(payload);
  const sig = signBytes(bytes);

  // SHA-256 of the canonical bytes — the single most efficient way to
  // confirm/deny parity with the client. If hashes match, the client's
  // ed25519 implementation is at fault, not the byte serialization.
  const { createHash } = await import("node:crypto");
  const sha = createHash("sha256").update(bytes).digest("hex");

  // Raw public key in hex — matches CHEAT_OFFSETS_PUBKEY in the client.
  const pubB64 = process.env.CHEAT_OFFSETS_ED25519_PUBLIC_KEY_B64 ?? "";
  const pubHex = Buffer.from(pubB64, "base64").toString("hex");

  return new Response(
    [
      `---BYTES-LENGTH---\n${bytes.length}`,
      `---CANONICAL-SHA256---\n${sha}`,
      "---CANONICAL-BYTES---",
      bytes.toString("utf8"),
      "---SIGNATURE-B64---",
      sig,
      "---PUBLIC-KEY-HEX---",
      pubHex,
      `---KEY-ID---\n${getOffsetsKeyId()}`,
    ].join("\n"),
    {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8" },
    },
  );
}
