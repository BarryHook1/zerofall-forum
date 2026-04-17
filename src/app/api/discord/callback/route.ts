import { cookies } from "next/headers";

import { getAppSession } from "@/lib/auth/session";
import {
  discordOAuthReturnToCookieName,
  discordOAuthStateCookieName,
  normalizeDiscordReturnTo,
} from "@/lib/discord/oauth";
import {
  DiscordLinkError,
  DiscordLinkService,
} from "@/server/services/discord-link-service";

function buildRedirect(request: Request, returnTo: string, status: string) {
  const url = new URL(returnTo, request.url);
  url.searchParams.set("discord", status);
  return Response.redirect(url, 303);
}

function mapDiscordLinkError(error: unknown) {
  if (error instanceof DiscordLinkError) {
    switch (error.code) {
      case "oauth_not_configured":
        return "oauth-unavailable";
      case "discord_already_linked":
        return "discord-in-use";
      case "discord_exchange_failed":
      case "invalid_callback_payload":
        return "exchange-failed";
      case "discord_identity_failed":
        return "identity-failed";
    }
  }

  return "exchange-failed";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const cookieStore = await cookies();
  const returnTo = normalizeDiscordReturnTo(
    cookieStore.get(discordOAuthReturnToCookieName)?.value,
  );
  const expectedState = cookieStore.get(discordOAuthStateCookieName)?.value;

  cookieStore.delete(discordOAuthStateCookieName);
  cookieStore.delete(discordOAuthReturnToCookieName);

  const receivedState = requestUrl.searchParams.get("state");
  if (!expectedState || !receivedState || expectedState !== receivedState) {
    return buildRedirect(request, returnTo, "state-mismatch");
  }

  const session = await getAppSession();
  if (!session?.user) {
    return buildRedirect(request, returnTo, "auth-required");
  }

  if (requestUrl.searchParams.get("error")) {
    return buildRedirect(request, returnTo, "access-denied");
  }

  const code = requestUrl.searchParams.get("code");
  if (!code) {
    return buildRedirect(request, returnTo, "exchange-failed");
  }

  const service = new DiscordLinkService();

  try {
    await service.linkDiscordAccount({
      userId: session.user.id,
      code,
    });

    return buildRedirect(request, returnTo, "linked");
  } catch (error) {
    return buildRedirect(request, returnTo, mapDiscordLinkError(error));
  }
}
