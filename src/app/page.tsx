import Link from "next/link";

import { FeatureGrid } from "@/components/public/feature-grid";
import { Hero } from "@/components/public/hero";
import { LandingAccessIntro } from "@/components/public/landing-access-intro";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <LandingAccessIntro>
      <div className="surface-grid min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_28%),linear-gradient(180deg,#09090b_0%,#050505_100%)]">
        <header className="border-b border-white/5">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
            <span className="text-sm uppercase tracking-[0.35em] text-zinc-300">Zerofall</span>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/genesis">
                <Button>Register Access</Button>
              </Link>
            </div>
          </div>
        </header>
        <main className="mx-auto flex max-w-7xl flex-col gap-20 px-6 py-16">
          <Hero />
          <FeatureGrid />
        </main>
      </div>
    </LandingAccessIntro>
  );
}
