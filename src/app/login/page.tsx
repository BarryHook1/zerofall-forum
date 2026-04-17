import { LoginForm } from "@/components/auth/login-form";
import { SiteShell } from "@/components/layout/site-shell";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <SiteShell eyebrow="Restricted Access" title="Login">
      <LoginForm callbackUrl={callbackUrl ?? "/dashboard"} />
    </SiteShell>
  );
}
