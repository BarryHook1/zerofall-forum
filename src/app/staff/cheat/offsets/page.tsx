import { SiteShell } from "@/components/layout/site-shell";
import { Card, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { requirePathAccess } from "@/lib/permissions/guards";
import { listOffsetsVersions } from "@/server/services/cheat/cheat-admin-service";

import { ActivateButton } from "./activate-button";
import { PublishOffsetsForm } from "./publish-offsets-form";

export const dynamic = "force-dynamic";

export default async function StaffCheatOffsetsPage() {
  await requirePathAccess("/staff");

  const versions = await listOffsetsVersions("valhalla");

  return (
    <SiteShell eyebrow="Operations" title="Cheat Offsets">
      <div className="grid gap-6">
        <Card>
          <CardTitle>Publish new version</CardTitle>
          <p className="mt-2 text-sm text-zinc-400">
            Paste a JSON object with the offsets. It will be signed with the
            server&apos;s Ed25519 private key and served to heartbeating clients.
            Publishing auto-activates unless you uncheck the box.
          </p>
          <PublishOffsetsForm />
        </Card>

        <Card>
          <CardTitle>Published versions</CardTitle>
          <div className="mt-4 overflow-x-auto">
            <Table>
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
                  <th className="border-b border-line py-2 pr-3">Version</th>
                  <th className="border-b border-line py-2 pr-3">Active</th>
                  <th className="border-b border-line py-2 pr-3">Published</th>
                  <th className="border-b border-line py-2 pr-3">By</th>
                  <th className="border-b border-line py-2 pr-3">Key</th>
                  <th className="border-b border-line py-2 pr-3">Notes</th>
                  <th className="border-b border-line py-2 pr-3"></th>
                </tr>
              </thead>
              <tbody>
                {versions.map((v) => (
                  <tr key={v.id}>
                    <td className="border-b border-line/50 py-2 pr-3 font-mono">
                      v{v.version}
                    </td>
                    <td className="border-b border-line/50 py-2 pr-3">
                      {v.active ? (
                        <span className="text-emerald-300">active</span>
                      ) : (
                        <span className="text-zinc-500">—</span>
                      )}
                    </td>
                    <td className="border-b border-line/50 py-2 pr-3 font-mono text-xs">
                      {v.publishedAt.toISOString().slice(0, 16).replace("T", " ")}
                    </td>
                    <td className="border-b border-line/50 py-2 pr-3">
                      {v.publishedBy?.username ?? "-"}
                    </td>
                    <td className="border-b border-line/50 py-2 pr-3 font-mono text-xs">
                      {v.publicKeyId}
                    </td>
                    <td className="border-b border-line/50 py-2 pr-3 text-xs text-zinc-400">
                      {v.notes ?? ""}
                    </td>
                    <td className="border-b border-line/50 py-2 pr-3">
                      {!v.active && <ActivateButton offsetsId={v.id} />}
                    </td>
                  </tr>
                ))}
                {versions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-zinc-500">
                      No offsets published yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card>
      </div>
    </SiteShell>
  );
}
