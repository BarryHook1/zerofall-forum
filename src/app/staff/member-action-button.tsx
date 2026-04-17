"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function MemberActionButton({
  endpoint,
  payload,
  idleLabel,
  pendingLabel,
  successLabel,
  variant = "secondary",
}: {
  endpoint: string;
  payload: Record<string, string>;
  idleLabel: string;
  pendingLabel: string;
  successLabel: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        type="button"
        variant={variant}
        className="h-9 px-4 text-xs"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            setError(null);
            setSuccess(false);

            const response = await fetch(endpoint, {
              method: "POST",
              headers: {
                "content-type": "application/json",
              },
              body: JSON.stringify(payload),
            });

            if (!response.ok) {
              setError("Action failed");
              return;
            }

            setSuccess(true);
            router.refresh();
          });
        }}
      >
        {pending ? pendingLabel : success ? successLabel : idleLabel}
      </Button>
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
