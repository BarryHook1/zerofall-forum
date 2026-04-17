import Link from "next/link";

import { SiteShell } from "@/components/layout/site-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requirePathAccess } from "@/lib/permissions/guards";

export default async function StaffPage() {
  await requirePathAccess("/staff");

  return (
    <SiteShell eyebrow="Operations" title="Staff">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardTitle>Members</CardTitle>
          <CardDescription className="mt-2">
            Search by UID, username, or email and operate rank, revoke, and reactivate.
          </CardDescription>
          <Link href="/staff/members" className="mt-5 inline-block text-sm text-zinc-200">
            Open members
          </Link>
        </Card>
        <Card>
          <CardTitle>Discord Sync</CardTitle>
          <CardDescription className="mt-2">
            Inspect outbox health, skipped deliveries, and retry failed webhook sends.
          </CardDescription>
          <Link href="/staff/discord-sync" className="mt-5 inline-block text-sm text-zinc-200">
            Open log
          </Link>
        </Card>
        <Card>
          <CardTitle>Payments</CardTitle>
          <CardDescription className="mt-2">
            Review Genesis entry confirmations and internal billing state changes.
          </CardDescription>
          <Link href="/staff/payments" className="mt-5 inline-block text-sm text-zinc-200">
            Open payments
          </Link>
        </Card>
        <Card>
          <CardTitle>Incidents</CardTitle>
          <CardDescription className="mt-2">
            Review revoke, decay, and manual intervention surfaces across the forum core.
          </CardDescription>
          <Link href="/staff/incidents" className="mt-5 inline-block text-sm text-zinc-200">
            Open incidents
          </Link>
        </Card>
        <Card>
          <CardTitle>Jobs</CardTitle>
          <CardDescription className="mt-2">
            Track webhook deliveries, subscription expiry, decay, and activation expiry runs.
          </CardDescription>
          <Link href="/staff/jobs" className="mt-5 inline-block text-sm text-zinc-200">
            Open jobs
          </Link>
        </Card>
      </div>
    </SiteShell>
  );
}
