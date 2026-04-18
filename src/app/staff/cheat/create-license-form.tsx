"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateLicenseForm() {
  const [username, setUsername] = useState("");
  const [days, setDays] = useState(30);
  const [hwidLimit, setHwidLimit] = useState(2);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<
    | { ok: true; licenseKey: string; expiresAt: string }
    | { ok: false; error: string }
    | null
  >(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/cheat/admin/licenses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, days, hwidLimit }),
      });
      const body = await res.json();
      if (!res.ok) {
        setResult({ ok: false, error: JSON.stringify(body.error ?? body) });
      } else {
        setResult({
          ok: true,
          licenseKey: body.licenseKey,
          expiresAt: new Date(body.expiresAt).toISOString(),
        });
        router.refresh();
      }
    } catch (err) {
      setResult({ ok: false, error: String(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
      <Input
        placeholder="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <Input
        type="number"
        min={1}
        max={3650}
        value={days}
        onChange={(e) => setDays(Number(e.target.value))}
        placeholder="days"
      />
      <Input
        type="number"
        min={1}
        max={10}
        value={hwidLimit}
        onChange={(e) => setHwidLimit(Number(e.target.value))}
        placeholder="hwid limit"
      />
      <Button type="submit" disabled={busy || !username}>
        {busy ? "Creating..." : "Create"}
      </Button>
      {result && (
        <div className="col-span-full text-sm">
          {result.ok ? (
            <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/30 px-3 py-2 text-emerald-200">
              License created. Expires {result.expiresAt}. Key (show to user once):{" "}
              <code className="break-all font-mono text-xs">
                {result.licenseKey}
              </code>
            </div>
          ) : (
            <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-red-200">
              {result.error}
            </div>
          )}
        </div>
      )}
    </form>
  );
}
