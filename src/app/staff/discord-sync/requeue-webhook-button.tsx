"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function RequeueWebhookButton({
  deliveryId,
  disabled = false,
}: {
  deliveryId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        type="button"
        variant="ghost"
        className="h-9 px-4 text-xs"
        disabled={disabled || pending}
        onClick={() => {
          startTransition(async () => {
            setError(null);
            setSuccess(false);

            const response = await fetch("/api/staff/requeue-webhook", {
              method: "POST",
              headers: {
                "content-type": "application/json",
              },
              body: JSON.stringify({ deliveryId }),
            });

            if (!response.ok) {
              setError("Retry failed");
              return;
            }

            setSuccess(true);
            router.refresh();
          });
        }}
      >
        {pending ? "Requeueing..." : success ? "Queued" : "Requeue"}
      </Button>
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
