import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requirePathAccess = vi.fn();

vi.mock("@/lib/permissions/guards", () => ({
  requirePathAccess,
}));

describe("onboarding information pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requirePathAccess.mockResolvedValue(null);
  });

  it("renders the welcome page with private ecosystem flow content", async () => {
    const { default: WelcomePage } = await import("@/app/welcome/page");
    const html = renderToStaticMarkup(await WelcomePage());

    expect(html).toContain("private ecosystem");
    expect(html).toContain("Genesis");
    expect(html).toContain("Account Created");
    expect(html).toContain("Activation");
    expect(html).toContain("Membership");
    expect(html).toContain("source of truth");
  });

  it("renders the rules page with access and revocation policy content", async () => {
    const { default: RulesPage } = await import("@/app/rules/page");
    const html = renderToStaticMarkup(await RulesPage());

    expect(html).toContain("community rules");
    expect(html).toContain("revocation");
    expect(html).toContain("controlled access");
    expect(html).toContain("no public self-registration");
  });

  it("renders the status page with all lifecycle states and transitions", async () => {
    const { default: StatusPage } = await import("@/app/status/page");
    const html = renderToStaticMarkup(StatusPage());

    for (const state of [
      "visitor",
      "entry_pending",
      "entry_confirmed",
      "awaiting_activation",
      "active",
      "dormant",
      "decayed",
      "revoked",
    ]) {
      expect(html).toContain(state);
    }

    expect(html).toContain("source of truth");
    expect(html).toContain("visitor to active");
  });

  it("renders the faq page with real MVP questions", async () => {
    const { default: FaqPage } = await import("@/app/faq/page");
    const html = renderToStaticMarkup(FaqPage());

    expect(html).toContain("Genesis");
    expect(html).toContain("UID");
    expect(html).toContain("activation deadline");
    expect(html).toContain("membership");
    expect(html).toContain("decay");
    expect(html).toContain("Discord");
    expect(html).toContain("revoke");
  });
});
