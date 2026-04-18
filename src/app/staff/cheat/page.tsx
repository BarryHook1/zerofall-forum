import Link from "next/link";

import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { requirePathAccess } from "@/lib/permissions/guards";
import {
  listLicenses,
  listRecentAuthLogs,
} from "@/server/services/cheat/cheat-admin-service";

import { CreateLicenseForm } from "./create-license-form";

export const dynamic = "force-dynamic";

export default async function StaffCheatPage() {
  await requirePathAccess("/staff");

  const [licenses, logs] = await Promise.all([
    listLicenses({ limit: 100 }),
    listRecentAuthLogs({ limit: 50 }),
  ]);

  return (
    <SiteShell eyebrow="Operations" title="Cheat Licensing">
      <div className="grid gap-6">
        <div className="flex items-center justify-end">
          <Link href="/staff/cheat/offsets">
            <Button variant="secondary">Manage offsets</Button>
          </Link>
        </div>

        <Card>
          <CardTitle>Create or rotate license</CardTitle>
          <CreateLicenseForm />
        </Card>

        <Card>
          <CardTitle>Licenses</CardTitle>
          <div className="mt-4 overflow-x-auto">
            <Table>
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
                  <th className="border-b border-line py-2 pr-3">User</th>
                  <th className="border-b border-line py-2 pr-3">Product</th>
                  <th className="border-b border-line py-2 pr-3">Status</th>
                  <th className="border-b border-line py-2 pr-3">Expires</th>
                  <th className="border-b border-line py-2 pr-3">HWIDs</th>
                  <th className="border-b border-line py-2 pr-3">Sessions</th>
                </tr>
              </thead>
              <tbody>
                {licenses.map((l) => (
                  <tr key={l.id}>
                    <td className="border-b border-line/50 py-2 pr-3">
                      {l.user.username}
                    </td>
                    <td className="border-b border-line/50 py-2 pr-3">
                      {l.product}
                    </td>
                    <td className="border-b border-line/50 py-2 pr-3">
                      <span
                        className={
                          l.status === "active"
                            ? "text-emerald-300"
                            : l.status === "revoked"
                              ? "text-red-300"
                              : "text-zinc-300"
                        }
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="border-b border-line/50 py-2 pr-3">
                      {l.expiresAt.toISOString().slice(0, 16).replace("T", " ")}
                    </td>
                    <td className="border-b border-line/50 py-2 pr-3">
                      {l.hwidBindings.length} / {l.hwidLimit}
                    </td>
                    <td className="border-b border-line/50 py-2 pr-3">
                      {l._count.sessions}
                    </td>
                  </tr>
                ))}
                {licenses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-zinc-500">
                      No licenses yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card>

        <Card>
          <CardTitle>Recent auth events</CardTitle>
          <div className="mt-4 overflow-x-auto">
            <Table>
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
                  <th className="border-b border-line py-2 pr-3">When</th>
                  <th className="border-b border-line py-2 pr-3">Event</th>
                  <th className="border-b border-line py-2 pr-3">Outcome</th>
                  <th className="border-b border-line py-2 pr-3">User</th>
                  <th className="border-b border-line py-2 pr-3">IP</th>
                  <th className="border-b border-line py-2 pr-3">Detail</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className="border-b border-line/50 py-2 pr-3 font-mono text-xs">
                      {l.createdAt.toISOString().slice(5, 19).replace("T", " ")}
                    </td>
                    <td className="border-b border-line/50 py-2 pr-3">{l.event}</td>
                    <td className="border-b border-line/50 py-2 pr-3">
                      <span
                        className={
                          l.outcome === "success"
                            ? "text-emerald-300"
                            : "text-red-300"
                        }
                      >
                        {l.outcome}
                      </span>
                    </td>
                    <td className="border-b border-line/50 py-2 pr-3">
                      {l.license?.user?.username ?? l.username ?? "-"}
                    </td>
                    <td className="border-b border-line/50 py-2 pr-3 font-mono text-xs">
                      {l.ipAddress ?? "-"}
                    </td>
                    <td className="border-b border-line/50 py-2 pr-3 text-xs text-zinc-400">
                      {l.detail ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>
      </div>
    </SiteShell>
  );
}
