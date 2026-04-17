import { beforeEach, describe, expect, it, vi } from "vitest";

const getAppSession = vi.fn();
const cookies = vi.fn();
const linkDiscordAccount = vi.fn();

class MockDiscordLinkError extends Error {
  code:
    | "oauth_not_configured"
    | "discord_exchange_failed"
    | "discord_identity_failed"
    | "discord_already_linked"
    | "invalid_callback_payload";

  constructor(message: string, code: MockDiscordLinkError["code"]) {
    super(message);
    this.code = code;
  }
}

vi.mock("@/lib/auth/session", () => ({
  getAppSession,
}));

vi.mock("next/headers", () => ({
  cookies,
}));

vi.mock("@/lib/discord/oauth", () => ({
  normalizeDiscordReturnTo: (value: string | null | undefined) =>
    !value || !value.startsWith("/") || value.startsWith("//")
      ? "/account-standing"
      : value,
  discordOAuthStateCookieName: "zf_discord_oauth_state",
  discordOAuthReturnToCookieName: "zf_discord_return_to",
}));

vi.mock("@/server/services/discord-link-service", () => ({
  DiscordLinkError: MockDiscordLinkError,
  DiscordLinkService: class {
    linkDiscordAccount = linkDiscordAccount;
  },
}));

describe("discord callback route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("rejects callbacks with mismatched forum-owned state", async () => {
    cookies.mockResolvedValue({
      get: vi.fn((name: string) => {
        if (name === "zf_discord_return_to") {
          return { value: "/dashboard" };
        }

        if (name === "zf_discord_oauth_state") {
          return { value: "expected-state" };
        }

        return undefined;
      }),
      delete: vi.fn(),
    });

    const { GET } = await import("@/app/api/discord/callback/route");
    const response = await GET(
      new Request("https://forum.example/api/discord/callback?state=wrong-state"),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://forum.example/dashboard?discord=state-mismatch",
    );
    expect(linkDiscordAccount).not.toHaveBeenCalled();
  });

  it("links the discord account and redirects back with success", async () => {
    cookies.mockResolvedValue({
      get: vi.fn((name: string) => {
        if (name === "zf_discord_return_to") {
          return { value: "/account-standing" };
        }

        if (name === "zf_discord_oauth_state") {
          return { value: "expected-state" };
        }

        return undefined;
      }),
      delete: vi.fn(),
    });
    getAppSession.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    linkDiscordAccount.mockResolvedValue({
      user: { id: "user-1" },
      syncEvent: "member.created",
    });

    const { GET } = await import("@/app/api/discord/callback/route");
    const response = await GET(
      new Request(
        "https://forum.example/api/discord/callback?state=expected-state&code=discord-code",
      ),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://forum.example/account-standing?discord=linked",
    );
    expect(linkDiscordAccount).toHaveBeenCalledWith({
      userId: "user-1",
      code: "discord-code",
    });
  });

  it("maps link conflicts back into a safe forum redirect", async () => {
    cookies.mockResolvedValue({
      get: vi.fn((name: string) => {
        if (name === "zf_discord_return_to") {
          return { value: "/account-standing" };
        }

        if (name === "zf_discord_oauth_state") {
          return { value: "expected-state" };
        }

        return undefined;
      }),
      delete: vi.fn(),
    });
    getAppSession.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    linkDiscordAccount.mockRejectedValue(
      new MockDiscordLinkError("already linked", "discord_already_linked"),
    );

    const { GET } = await import("@/app/api/discord/callback/route");
    const response = await GET(
      new Request(
        "https://forum.example/api/discord/callback?state=expected-state&code=discord-code",
      ),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://forum.example/account-standing?discord=discord-in-use",
    );
  });
});
