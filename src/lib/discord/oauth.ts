import { randomBytes } from "node:crypto";

import { getAuthUrl } from "@/lib/auth/env";

export const discordOAuthStateCookieName = "zf_discord_oauth_state";
export const discordOAuthReturnToCookieName = "zf_discord_return_to";
export const discordOAuthStateMaxAgeSeconds = 60 * 10;

const discordAuthorizeUrl = "https://discord.com/oauth2/authorize";
const discordTokenUrl = "https://discord.com/api/oauth2/token";
const discordIdentityUrl = "https://discord.com/api/users/@me";

export function getDiscordOAuthConfig() {
  const clientId = process.env.DISCORD_OAUTH_CLIENT_ID;
  const clientSecret = process.env.DISCORD_OAUTH_CLIENT_SECRET;
  const appUrl = getAuthUrl();

  if (!clientId || !clientSecret || !appUrl) {
    throw new Error("Discord OAuth is not configured");
  }

  return {
    clientId,
    clientSecret,
    callbackUrl: new URL("/api/discord/callback", appUrl).toString(),
    authorizeUrl: discordAuthorizeUrl,
    tokenUrl: discordTokenUrl,
    identityUrl: discordIdentityUrl,
  };
}

export function createDiscordOAuthState() {
  return randomBytes(24).toString("hex");
}

export function normalizeDiscordReturnTo(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/account-standing";
  }

  return value;
}

export function buildDiscordAuthorizeUrl(state: string, returnTo?: string | null) {
  const config = getDiscordOAuthConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.callbackUrl,
    response_type: "code",
    scope: "identify",
    state,
  });

  const normalizedReturnTo = normalizeDiscordReturnTo(returnTo);

  if (normalizedReturnTo !== "/account-standing") {
    params.set("prompt", "consent");
  }

  return `${config.authorizeUrl}?${params.toString()}`;
}
