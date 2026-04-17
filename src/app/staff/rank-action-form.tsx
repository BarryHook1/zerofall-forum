"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

const rankOptions = [
  { value: "none", label: "none" },
  { value: "verified", label: "verified" },
  { value: "elite", label: "elite" },
  { value: "vanguard", label: "vanguard" },
  { value: "genesis_founder", label: "genesis_founder" },
] as const;

export function RankActionForm({
  userId,
  currentRank,
}: {
  userId: string;
  currentRank: (typeof rankOptions)[number]["value"];
}) {
  const router = useRouter();
  const [rank, setRank] = useState(currentRank);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <select
          value={rank}
          onChange={(event) => {
            setRank(event.target.value as typeof currentRank);
            setSuccess(false);
          }}
          className="h-9 rounded-full border border-white/10 bg-zinc-950 px-4 text-xs text-zinc-100 outline-none"
          disabled={pending}
        >
          {rankOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="ghost"
          className="h-9 px-4 text-xs"
          disabled={pending || rank === currentRank}
          onClick={() => {
            startTransition(async () => {
              setError(null);
              setSuccess(false);

              const response = await fetch("/api/staff/update-rank", {
                method: "POST",
                headers: {
                  "content-type": "application/json",
                },
                body: JSON.stringify({ userId, rank }),
              });

              if (!response.ok) {
                setError("Rank update failed");
                return;
              }

              setSuccess(true);
              router.refresh();
            });
          }}
        >
          {pending ? "Saving..." : success ? "Saved" : "Apply"}
        </Button>
      </div>
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
