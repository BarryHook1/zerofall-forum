import { cookies } from "next/headers";

import { createAuditLog } from "@/lib/audit/logging";
import {
  buildDiscordAuthorizeUrl,
  createDiscordOAuthState,
  discordOAuthReturnToCookieName,
  discordOAuthStateCookieName,
  discordOAuthStateMaxAgeSeconds,
  normalizeDiscordReturnTo,
} from "@/lib/discord/oauth";
import { requireAppSession } from "@/lib/auth/session";

function buildRedirect(request: Request, returnTo: string, status: string) {
  const url = new URL(returnTo, request.url);
  url.searchParams.set("discord", status);
  return Response.redirect(url, 303);
}

export async function GET(request: Request) {
  const session = await requireAppSession();
  const requestUrl = new URL(request.url);
  const returnTo = normalizeDiscordReturnTo(
    requestUrl.searchParams.get("returnTo"),
  );

  try {
    const state = createDiscordOAuthState();
    const cookieStore = await cookies();

    cookieStore.set(discordOAuthStateCookieName, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: discordOAuthStateMaxAgeSeconds,
      path: "/",
    });
    cookieStore.set(discordOAuthReturnToCookieName, returnTo, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: discordOAuthStateMaxAgeSeconds,
      path: "/",
    });

    await createAuditLog({
      userId: session.user.id,
      actorId: session.user.id,
      eventType: "discord.account_link_started",
      meta: {
        returnTo,
      },
    });

    return Response.redirect(buildDiscordAuthorizeUrl(state, returnTo), 303);
  } catch {
    return buildRedirect(request, returnTo, "oauth-unavailable");
  }
}
