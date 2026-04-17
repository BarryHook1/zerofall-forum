"use client";

import { useState } from "react";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <Card className="max-w-lg">
      <CardTitle>Private Login</CardTitle>
      <CardDescription className="mt-2">
        Only members created through the Genesis entry flow can authenticate.
      </CardDescription>
      <form
        className="mt-6 space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setError(null);

          const formData = new FormData(event.currentTarget);
          const result = await signIn("credentials", {
            email: String(formData.get("email") ?? ""),
            password: String(formData.get("password") ?? ""),
            redirect: false,
            callbackUrl,
          });

          setPending(false);

          if (!result || result.error) {
            setError("Invalid credentials or inactive account.");
            return;
          }

          router.push(result.url ?? callbackUrl);
          router.refresh();
        }}
      >
        <Input name="email" type="email" placeholder="Email" required />
        <Input name="password" type="password" placeholder="Password" required />
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <Button type="submit" fullWidth disabled={pending}>
          {pending ? "Authenticating..." : "Enter Forum"}
        </Button>
      </form>
    </Card>
  );
}
