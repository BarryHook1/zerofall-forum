"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function PublishOffsetsForm() {
  const [jsonText, setJsonText] = useState<string>(
    JSON.stringify(
      {
        GWorld: 0,
        GNames: 0,
        persistent_level: 0,
        actor_array: 0,
      },
      null,
      2,
    ),
  );
  const [notes, setNotes] = useState("");
  const [activate, setActivate] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("offsets must be a JSON object at the top level");
      }
    } catch (err) {
      setMsg({ kind: "err", text: `Invalid JSON: ${String(err)}` });
      setBusy(false);
      return;
    }

    try {
      const res = await fetch("/api/cheat/admin/offsets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          product: "valhalla",
          data: parsed,
          notes: notes || undefined,
          activate,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setMsg({
          kind: "err",
          text: `Publish failed: ${JSON.stringify(body.error ?? body)}`,
        });
      } else {
        setMsg({
          kind: "ok",
          text: `Published v${body.version} (${body.active ? "active" : "inactive"}).`,
        });
        router.refresh();
      }
    } catch (err) {
      setMsg({ kind: "err", text: String(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 grid gap-3">
      <textarea
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        rows={12}
        className="w-full rounded-xl border border-line bg-surface-strong px-3 py-2 font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent/25"
        spellCheck={false}
        required
      />
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (e.g. Valorant patch 9.12)"
        className="h-10 w-full rounded-xl border border-line bg-surface-strong px-3 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent/25"
      />
      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={activate}
          onChange={(e) => setActivate(e.target.checked)}
        />
        Activate immediately (deactivates the current version)
      </label>
      <div>
        <Button type="submit" disabled={busy}>
          {busy ? "Publishing..." : "Publish + sign"}
        </Button>
      </div>
      {msg && (
        <div
          className={
            msg.kind === "ok"
              ? "rounded-lg border border-emerald-900/50 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200"
              : "rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-200"
          }
        >
          {msg.text}
        </div>
      )}
    </form>
  );
}
