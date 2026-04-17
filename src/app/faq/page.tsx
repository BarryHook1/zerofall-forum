import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const faqs = [
  {
    question: "Can I enter without the Genesis path?",
    answer:
      "No. Entry is controlled. There is no public self-registration flow that bypasses Genesis or the forum-owned entry path.",
  },
  {
    question: "When is my UID issued?",
    answer:
      "UID is issued only after confirmed entry and account provisioning inside the forum. It is not created during casual browsing or public interest.",
  },
  {
    question: "What does activation deadline mean?",
    answer:
      "Activation deadline is the window in which a provisioned account is expected to complete onboarding. Missing that window can block the account from reaching active standing.",
  },
  {
    question: "When does membership actually begin?",
    answer:
      "Membership begins when the forum records the member as active after the controlled activation path is completed.",
  },
  {
    question: "What happens if membership is not maintained?",
    answer:
      "At a high level, the path is active to dormant and then dormant to decayed if the account is no longer in good standing.",
  },
  {
    question: "Why can Discord look different from the forum?",
    answer:
      "Discord is a mirror, not the authority. The forum is the source of truth, so temporary differences are resolved by forum-owned state, not by Discord alone.",
  },
  {
    question: "What does revoke mean?",
    answer:
      "Revoke means the forum has explicitly removed access because the account no longer satisfies the platform’s policy or controlled-access requirements.",
  },
] as const;

export default function FaqPage() {
  return (
    <SiteShell eyebrow="Information" title="FAQ">
      <Card className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <Badge>MVP FAQ</Badge>
        <CardTitle className="mt-5 text-3xl">Practical answers for the current forum model.</CardTitle>
        <CardDescription className="mt-4 max-w-2xl text-base text-zinc-300">
          These answers stay inside stable MVP behavior: entry, UID, activation,
          membership, decay, Discord mirror behavior, and revoke.
        </CardDescription>
      </Card>

      <div className="mt-6 grid gap-4">
        {faqs.map((item, index) => (
          <Card key={item.question} className="relative overflow-hidden">
            <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-white/30 via-white/10 to-transparent" />
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Question {index + 1}
            </p>
            <h2 className="mt-3 text-xl font-medium text-zinc-100">{item.question}</h2>
            <p className="mt-4 text-sm leading-6 text-zinc-400">{item.answer}</p>
          </Card>
        ))}
      </div>
    </SiteShell>
  );
}
