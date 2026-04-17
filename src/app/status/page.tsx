import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const states = [
  {
    name: "visitor",
    meaning: "No controlled entry has started yet.",
  },
  {
    name: "entry_pending",
    meaning: "Entry has started but is not confirmed yet.",
  },
  {
    name: "entry_confirmed",
    meaning: "Entry has been confirmed and the forum can provision the account path.",
  },
  {
    name: "awaiting_activation",
    meaning: "The account exists, but activation is still pending.",
  },
  {
    name: "active",
    meaning: "The member is fully onboarded and in good standing.",
  },
  {
    name: "dormant",
    meaning: "The membership is no longer current, but the account has not decayed yet.",
  },
  {
    name: "decayed",
    meaning: "The account remains known to the forum, but access has fallen below active standing.",
  },
  {
    name: "revoked",
    meaning: "Access has been explicitly removed by forum policy or enforcement.",
  },
] as const;

const transitions = [
  "visitor to active follows the controlled path: visitor -> entry_pending -> entry_confirmed -> awaiting_activation -> active",
  "An active member can move from active -> dormant -> decayed when membership is no longer maintained",
  "Revoked is the enforcement state when access must be explicitly removed",
] as const;

export default function StatusPage() {
  return (
    <SiteShell eyebrow="Lifecycle" title="Status Model">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <Badge>Lifecycle</Badge>
          <CardTitle className="mt-5 text-3xl">How the forum understands status.</CardTitle>
          <CardDescription className="mt-4 max-w-2xl text-base text-zinc-300">
            The forum tracks the lifecycle of entry, activation, and ongoing
            membership as a state machine. This is the source of truth for access
            state, while mirrored surfaces only reflect what the forum already
            recorded.
          </CardDescription>
        </Card>

        <Card>
          <Badge>High-Level Transitions</Badge>
          <CardTitle className="mt-5">State changes stay forum-owned.</CardTitle>
          <div className="mt-6 space-y-3">
            {transitions.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/8 bg-black/20 p-4 text-sm leading-6 text-zinc-300"
              >
                {item}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {states.map((state) => (
          <Card key={state.name}>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">State</p>
            <CardTitle className="mt-3 text-xl">{state.name}</CardTitle>
            <CardDescription className="mt-4">{state.meaning}</CardDescription>
          </Card>
        ))}
      </div>
    </SiteShell>
  );
}
