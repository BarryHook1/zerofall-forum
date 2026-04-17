import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAppSession = vi.fn();
const createAuditLog = vi.fn();
const cookies = vi.fn();
const createDiscordOAuthState = vi.fn();
const buildDiscordAuthorizeUrl = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  requireAppSession,
}));

vi.mock("@/lib/audit/logging", () => ({
  createAuditLog,
}));

vi.mock("next/headers", () => ({
  cookies,
}));

vi.mock("@/lib/discord/oauth", () => ({
  createDiscordOAuthState,
  buildDiscordAuthorizeUrl,
  normalizeDiscordReturnTo: (value: string | null | undefined) =>
    !value || !value.startsWith("/") || value.startsWith("//")
      ? "/account-standing"
      : value,
  discordOAuthStateCookieName: "zf_discord_oauth_state",
  discordOAuthReturnToCookieName: "zf_discord_return_to",
  discordOAuthStateMaxAgeSeconds: 600,
}));

describe("discord link route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("starts the discord oauth flow and stores forum-owned state cookies", async () => {
    const cookieStore = {
      set: vi.fn(),
    };

    requireAppSession.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    cookies.mockResolvedValue(cookieStore);
    createDiscordOAuthState.mockReturnValue("state-123");
    buildDiscordAuthorizeUrl.mockReturnValue(
      "https://discord.com/oauth2/authorize?state=state-123",
    );

    const { GET } = await import("@/app/api/discord/link/route");
    const response = await GET(
      new Request("https://forum.example/api/discord/link?returnTo=%2Fdashboard"),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://discord.com/oauth2/authorize?state=state-123",
    );
    expect(cookieStore.set).toHaveBeenCalledTimes(2);
    expect(createAuditLog).toHaveBeenCalledWith({
      userId: "user-1",
      actorId: "user-1",
      eventType: "discord.account_link_started",
      meta: {
        returnTo: "/dashboard",
      },
    });
  });

  it("redirects back to account standing when oauth config is unavailable", async () => {
    requireAppSession.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    cookies.mockResolvedValue({
      set: vi.fn(),
    });
    createDiscordOAuthState.mockImplementation(() => {
      throw new Error("missing env");
    });

    const { GET } = await import("@/app/api/discord/link/route");
    const response = await GET(
      new Request("https://forum.example/api/discord/link"),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://forum.example/account-standing?discord=oauth-unavailable",
    );
  });
});
