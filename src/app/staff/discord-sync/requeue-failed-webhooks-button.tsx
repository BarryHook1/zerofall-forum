"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function RequeueFailedWebhooksButton({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        type="button"
        variant="secondary"
        disabled={disabled || pending}
        onClick={() => {
          startTransition(async () => {
            setError(null);
            setCount(null);

            const response = await fetch("/api/staff/requeue-all-webhooks", {
              method: "POST",
            });

            if (!response.ok) {
              setError("Bulk requeue failed");
              return;
            }

            const result = (await response.json()) as { result?: { count?: number } };
            setCount(result.result?.count ?? 0);
            router.refresh();
          });
        }}
      >
        {pending ? "Requeueing..." : "Requeue All Failed"}
      </Button>
      {count !== null ? (
        <p className="text-xs text-zinc-500">{count} deliveries reset to pending.</p>
      ) : null}
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
