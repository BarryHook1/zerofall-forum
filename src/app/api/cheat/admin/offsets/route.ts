// GET  /api/cheat/admin/offsets?product=valhalla
//        → list every stored version with who published what when.
// POST /api/cheat/admin/offsets
//        body: { product?, data: Record<string, number|string>, notes?, activate? }
//        → create + sign + (default: activate) a new version.

import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiPathAccess } from "@/lib/permissions/guards";
import {
  listOffsetsVersions,
  publishOffsets,
} from "@/server/services/cheat/cheat-admin-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PublishSchema = z.object({
  product: z.enum(["valhalla"]).default("valhalla"),
  // Offsets payload. Must be a plain JSON object — values can be numbers
  // (0x1234 serialized), hex strings, or nested objects. The C++ client
  // decides what to do with them. We store it verbatim so canonicalization
  // matches server + client.
  data: z.record(z.string(), z.any()),
  notes: z.string().max(500).optional(),
  activate: z.boolean().optional(),
});

export async function GET(req: Request) {
  const auth = await requireApiPathAccess("/staff");
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const product =
    (url.searchParams.get("product") as "valhalla" | null) ?? "valhalla";
  const rows = await listOffsetsVersions(product);
  return NextResponse.json({
    versions: rows.map((r) => ({
      id: r.id,
      product: r.product,
      version: r.version,
      active: r.active,
      keyId: r.publicKeyId,
      notes: r.notes,
      publishedAt: r.publishedAt,
      publishedBy: r.publishedBy,
      // offsetsJson omitted from list (can be large); fetch per-version if needed.
    })),
  });
}

export async function POST(req: Request) {
  const auth = await requireApiPathAccess("/staff");
  if (!auth.ok) return auth.response;

  const parsed = PublishSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const row = await publishOffsets({
    product: parsed.data.product,
    data: parsed.data.data,
    notes: parsed.data.notes,
    activate: parsed.data.activate,
    actorId: auth.session.user.id,
  });

  return NextResponse.json(
    {
      id: row.id,
      product: row.product,
      version: row.version,
      active: row.active,
      keyId: row.publicKeyId,
      publishedAt: row.publishedAt,
    },
    { status: 201 },
  );
}
