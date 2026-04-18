"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function ActivateButton({ offsetsId }: { offsetsId: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function activate() {
    setBusy(true);
    try {
      const res = await fetch(`/api/cheat/admin/offsets/${offsetsId}/activate`, {
        method: "POST",
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="secondary" onClick={activate} disabled={busy}>
      {busy ? "Activating..." : "Activate"}
    </Button>
  );
}
