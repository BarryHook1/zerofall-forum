import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAppSession = vi.fn();
const unlinkDiscordAccount = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  requireAppSession,
}));

vi.mock("@/server/services/discord-link-service", () => ({
  DiscordLinkService: class {
    unlinkDiscordAccount = unlinkDiscordAccount;
  },
}));

describe("discord unlink route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("removes the current discord link for the authenticated forum member", async () => {
    requireAppSession.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    unlinkDiscordAccount.mockResolvedValue({
      id: "user-1",
      discordId: null,
    });

    const formData = new FormData();
    formData.set("returnTo", "/dashboard");

    const { POST } = await import("@/app/api/discord/unlink/route");
    const response = await POST(
      new Request("https://forum.example/api/discord/unlink", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://forum.example/dashboard?discord=unlinked",
    );
    expect(unlinkDiscordAccount).toHaveBeenCalledWith({
      userId: "user-1",
    });
  });
});
