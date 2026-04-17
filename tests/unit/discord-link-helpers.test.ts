import { describe, expect, it } from "vitest";

import { getDiscordLinkFlash } from "@/lib/discord/link-presentation";
import { normalizeDiscordReturnTo } from "@/lib/discord/oauth";
import { resolveDiscordLinkSyncEvent } from "@/server/services/discord-link-service";

describe("discord link helpers", () => {
  it("normalizes unsafe return targets to account standing", () => {
    expect(normalizeDiscordReturnTo(null)).toBe("/account-standing");
    expect(normalizeDiscordReturnTo("https://discord.com")).toBe(
      "/account-standing",
    );
    expect(normalizeDiscordReturnTo("//evil.example")).toBe(
      "/account-standing",
    );
    expect(normalizeDiscordReturnTo("/dashboard")).toBe("/dashboard");
  });

  it("resolves lifecycle sync events from the current forum state", () => {
    expect(
      resolveDiscordLinkSyncEvent({
        entryStatus: "entry_confirmed",
        membershipStatus: "awaiting_activation",
      }),
    ).toBe("member.created");
    expect(
      resolveDiscordLinkSyncEvent({
        entryStatus: "entry_confirmed",
        membershipStatus: "active",
      }),
    ).toBe("subscription.activated");
    expect(
      resolveDiscordLinkSyncEvent({
        entryStatus: "entry_confirmed",
        membershipStatus: "dormant",
      }),
    ).toBe("subscription.expired");
    expect(
      resolveDiscordLinkSyncEvent({
        entryStatus: "entry_confirmed",
        membershipStatus: "decayed",
      }),
    ).toBe("subscription.decayed");
    expect(
      resolveDiscordLinkSyncEvent({
        entryStatus: "revoked",
        membershipStatus: "awaiting_activation",
      }),
    ).toBe("account.revoked");
  });

  it("maps flash codes into user-facing forum messages", () => {
    expect(getDiscordLinkFlash("linked")).toMatchObject({
      tone: "success",
      title: "Discord linked",
    });
    expect(getDiscordLinkFlash("discord-in-use")).toMatchObject({
      tone: "error",
      title: "Discord already linked",
    });
    expect(getDiscordLinkFlash("unknown")).toBeNull();
  });
});
