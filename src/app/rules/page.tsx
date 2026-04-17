import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requirePathAccess } from "@/lib/permissions/guards";

const communityRules = [
  {
    title: "Respect the private environment",
    detail:
      "Treat Zerofall as a controlled community surface, not an open social feed. Access is granted deliberately and is expected to be used responsibly.",
  },
  {
    title: "Protect account integrity",
    detail:
      "Do not share access, impersonate identity, or attempt to bypass the forum’s lifecycle and account controls.",
  },
  {
    title: "No abuse of private access",
    detail:
      "Private membership is not a loophole for spam, harassment, fraud, or misuse of restricted surfaces.",
  },
  {
    title: "Follow forum-owned boundaries",
    detail:
      "Operational state is decided by the forum. Members should not treat mirrored surfaces as authoritative replacements.",
  },
] as const;

const revocationReasons = [
  "Fraud, charge abuse, or payment manipulation",
  "Repeated violations of community rules",
  "Attempts to bypass controlled access or activation flow",
  "Misuse of private access after entry is granted",
] as const;

export default async function RulesPage() {
  await requirePathAccess("/rules");

  return (
    <SiteShell eyebrow="Entry Area" title="Rules">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <Badge>Community Rules</Badge>
          <CardTitle className="mt-5 text-3xl">Private access comes with explicit boundaries.</CardTitle>
          <CardDescription className="mt-4 max-w-2xl text-base text-zinc-300">
            Zerofall is a controlled-access forum. Community rules, revocation
            policy, and access boundaries exist to protect the ecosystem, not to
            simulate an open public signup platform.
          </CardDescription>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {communityRules.map((rule) => (
              <div
                key={rule.title}
                className="rounded-2xl border border-white/8 bg-black/20 p-4"
              >
                <p className="text-sm font-medium text-zinc-100">{rule.title}</p>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{rule.detail}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-6">
          <Card>
            <Badge>Controlled Access</Badge>
            <CardTitle className="mt-5">no public self-registration</CardTitle>
            <CardDescription className="mt-4 text-base text-zinc-300">
              There is no free public signup path into this ecosystem. Entry is
              intentionally controlled, account creation follows the forum-owned
              path, and unrestricted open registration does not exist here.
            </CardDescription>
          </Card>

          <Card>
            <Badge>Revocation</Badge>
            <CardTitle className="mt-5">Access can be revoked.</CardTitle>
            <CardDescription className="mt-4">
              Revocation is reserved for material violations of trust, payment
              integrity, or controlled access rules.
            </CardDescription>
            <div className="mt-6 space-y-3">
              {revocationReasons.map((reason) => (
                <div
                  key={reason}
                  className="rounded-2xl border border-white/8 bg-black/20 p-4 text-sm leading-6 text-zinc-300"
                >
                  {reason}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </SiteShell>
  );
}
