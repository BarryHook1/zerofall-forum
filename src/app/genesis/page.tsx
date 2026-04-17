import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function GenesisPage() {
  return (
    <SiteShell eyebrow="Genesis Drop" title="Register Access">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.7fr]">
        <Card>
          <CardTitle>Controlled entry only</CardTitle>
          <CardDescription className="mt-3">
            The Genesis Drop creates your private account only after Stripe confirms the
            entry payment. UID issuance happens inside that same provisioning transaction.
          </CardDescription>
          <form action="/api/genesis/checkout" method="post" className="mt-8 space-y-4">
            <Input name="username" placeholder="Username" required />
            <Input name="email" type="email" placeholder="Email" required />
            <Input name="password" type="password" placeholder="Password" required />
            <Button type="submit">Continue To Checkout</Button>
          </form>
        </Card>
        <Card>
          <CardTitle>What happens next</CardTitle>
          <div className="mt-5 space-y-4 text-sm leading-6 text-zinc-300">
            <p>1. Entry payment is confirmed.</p>
            <p>2. Account is provisioned.</p>
            <p>3. UID is generated sequentially.</p>
            <p>4. Status becomes awaiting activation.</p>
            <p>5. Internal membership becomes available in the dashboard.</p>
          </div>
        </Card>
      </div>
    </SiteShell>
  );
}
