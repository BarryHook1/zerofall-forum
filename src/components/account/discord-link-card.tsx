import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getDiscordLinkFlash } from "@/lib/discord/link-presentation";

type DiscordLinkCardProps = {
  discordId: string | null;
  returnTo?: string;
  flashCode?: string | null;
};

const flashToneClasses = {
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-100",
  neutral: "border-white/10 bg-black/20 text-zinc-100",
  error: "border-red-500/20 bg-red-500/10 text-red-100",
} as const;

export function DiscordLinkCard({
  discordId,
  returnTo = "/account-standing",
  flashCode,
}: DiscordLinkCardProps) {
  const flash = getDiscordLinkFlash(flashCode);

  return (
    <Card>
      <CardTitle>Discord Identity</CardTitle>
      <CardDescription className="mt-2">
        The forum owns the linked Discord identity. The bot only mirrors forum state after a valid link exists.
      </CardDescription>
      <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/20 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Current Link</p>
          <p className="mt-3 text-sm text-zinc-100">
            {discordId ? `Discord ID ${discordId}` : "No Discord account linked"}
          </p>
        </div>
        <Badge>{discordId ? "linked" : "unlinked"}</Badge>
      </div>

      {flash ? (
        <div
          className={`mt-4 rounded-2xl border px-4 py-3 ${flashToneClasses[flash.tone]}`}
        >
          <p className="text-sm font-medium">{flash.title}</p>
          <p className="mt-1 text-sm opacity-90">{flash.description}</p>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <form action="/api/discord/link" method="get">
          <input type="hidden" name="returnTo" value={returnTo} />
          <Button type="submit">{discordId ? "Relink Discord" : "Link Discord"}</Button>
        </form>
        {discordId ? (
          <form action="/api/discord/unlink" method="post">
            <input type="hidden" name="returnTo" value={returnTo} />
            <Button type="submit" variant="ghost">
              Unlink Discord
            </Button>
          </form>
        ) : null}
      </div>
    </Card>
  );
}
