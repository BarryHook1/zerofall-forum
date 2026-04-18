import { redirect } from "next/navigation";

import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db/prisma";
import { getAppSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function CheatPage() {
  const session = await getAppSession();
  if (!session?.user) {
    redirect("/login?callbackUrl=/cheat");
  }

  const licenses = await prisma.cheatLicense.findMany({
    where: { userId: session.user.id },
    include: { hwidBindings: true },
    orderBy: { product: "asc" },
  });

  const now = Date.now();

  return (
    <SiteShell eyebrow="Loader" title="Valhalla">
      <div className="grid gap-4 md:grid-cols-2">
        {licenses.length === 0 && (
          <Card>
            <CardTitle>No license</CardTitle>
            <CardDescription className="mt-2">
              Your account doesn&apos;t have an active loader license. Contact staff
              for access.
            </CardDescription>
          </Card>
        )}

        {licenses.map((l) => {
          const canUse =
            l.status === "active" &&
            l.expiresAt.getTime() > now &&
            !l.revokedAt;
          const statusLabel = canUse
            ? "Active"
            : l.status === "revoked"
              ? "Revoked"
              : l.status === "expired" || l.expiresAt.getTime() <= now
                ? "Expired"
                : l.status;

          return (
            <Card key={l.id}>
              <CardTitle>{productLabel(l.product)}</CardTitle>
              <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-zinc-400">Status</dt>
                <dd
                  className={
                    canUse ? "text-emerald-300" : "text-zinc-300"
                  }
                >
                  {statusLabel}
                </dd>
                <dt className="text-zinc-400">Expires</dt>
                <dd>{l.expiresAt.toISOString().slice(0, 10)}</dd>
                <dt className="text-zinc-400">HWIDs bound</dt>
                <dd>
                  {l.hwidBindings.length} / {l.hwidLimit}
                </dd>
              </dl>

              <div className="mt-5">
                {canUse ? (
                  <a
                    href={`/api/cheat/download?product=${l.product}`}
                    className="inline-block"
                  >
                    <Button>Download loader</Button>
                  </a>
                ) : (
                  <Button disabled variant="secondary">
                    Download unavailable
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </SiteShell>
  );
}

function productLabel(product: string): string {
  switch (product) {
    case "valhalla":
      return "Valhalla (Valorant)";
    default:
      return product;
  }
}
