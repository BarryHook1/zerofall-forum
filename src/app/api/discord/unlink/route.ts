import { requireAppSession } from "@/lib/auth/session";
import { normalizeDiscordReturnTo } from "@/lib/discord/oauth";
import { DiscordLinkService } from "@/server/services/discord-link-service";

export async function POST(request: Request) {
  const session = await requireAppSession();
  const formData = await request.formData();
  const returnTo = normalizeDiscordReturnTo(
    String(formData.get("returnTo") ?? "/account-standing"),
  );

  const service = new DiscordLinkService();
  await service.unlinkDiscordAccount({
    userId: session.user.id,
  });

  const url = new URL(returnTo, request.url);
  url.searchParams.set("discord", "unlinked");

  return Response.redirect(url, 303);
}
