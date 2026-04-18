// GET /api/cheat/download?product=valhalla
//
// Gated loader download. Requires a logged-in NextAuth session AND an
// active, unexpired license for the requested product.
//
// Storage strategy: the actual .exe is hosted out-of-band at a URL the
// server knows (CHEAT_LOADER_URL_VALHALLA env var). On a valid request we
// fetch it and stream it back to the client so:
//   - The storage URL stays private (never sent to the browser).
//   - Every download is audited via cheat_auth_logs.
//   - We can rotate the URL without touching clients.
//
// If the env var is unset, the route returns 503 with a clear error —
// useful while you're iterating on the loader binary.

import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { getAppSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function urlForProduct(product: "valhalla"): string | null {
  switch (product) {
    case "valhalla":
      return process.env.CHEAT_LOADER_URL_VALHALLA ?? null;
    default:
      return null;
  }
}

export async function GET(req: Request) {
  const session = await getAppSession();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const product = (url.searchParams.get("product") as "valhalla" | null) ?? "valhalla";

  const license = await prisma.cheatLicense.findUnique({
    where: { userId_product: { userId: session.user.id, product } },
  });

  if (!license) {
    return NextResponse.json({ error: "no_license" }, { status: 403 });
  }
  if (license.status === "revoked") {
    return NextResponse.json({ error: "license_revoked" }, { status: 403 });
  }
  if (license.status === "expired" || license.expiresAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: "license_expired" }, { status: 403 });
  }

  const upstream = urlForProduct(product);
  if (!upstream) {
    return NextResponse.json({ error: "loader_not_configured" }, { status: 503 });
  }

  // Record the download.
  await prisma.cheatAuthLog.create({
    data: {
      licenseId: license.id,
      event: "download",
      outcome: "success",
      ipAddress: getClientIp(req),
      userAgent: req.headers.get("user-agent") ?? null,
      detail: `product=${product}`,
    },
  });

  // Fetch the binary and pipe it through. Using manual streaming so we
  // don't buffer the whole file in memory on Vercel.
  const upstreamRes = await fetch(upstream, { cache: "no-store" });
  if (!upstreamRes.ok || !upstreamRes.body) {
    return NextResponse.json({ error: "loader_fetch_failed" }, { status: 502 });
  }

  return new Response(upstreamRes.body, {
    status: 200,
    headers: {
      "content-type": "application/octet-stream",
      "content-disposition": `attachment; filename="${product}.exe"`,
      "cache-control": "no-store",
    },
  });
}

function getClientIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return null;
}
