import { canAccessPath, isPublicPath } from "@/lib/permissions/access";
import { resolveAccessDecision, resolveApiAccessDecision } from "@/lib/permissions/guards";

describe("route guards", () => {
  it("keeps the public routes open", () => {
    expect(isPublicPath("/")).toBe(true);
    expect(isPublicPath("/genesis")).toBe(true);
    expect(isPublicPath("/dashboard")).toBe(false);
  });

  it("redirects visitors to login for private routes", () => {
    expect(resolveAccessDecision("/dashboard", null)).toEqual({
      allowed: false,
      redirectTo: "/login?callbackUrl=%2Fdashboard",
    });
  });

  it("allows awaiting activation members into the onboarding routes", () => {
    expect(
      canAccessPath(
        { accountRole: "member", membershipStatus: "awaiting_activation" },
        "/activation",
      ),
    ).toBe(true);
    expect(
      canAccessPath(
        { accountRole: "member", membershipStatus: "awaiting_activation" },
        "/renewals",
      ),
    ).toBe(false);
  });

  it("grants staff access to staff routes", () => {
    expect(
      canAccessPath({ accountRole: "admin", membershipStatus: "revoked" }, "/staff"),
    ).toBe(true);
    expect(
      canAccessPath({ accountRole: "admin", membershipStatus: "revoked" }, "/staff/jobs"),
    ).toBe(true);
    expect(
      resolveAccessDecision("/staff/payments", {
        accountRole: "admin",
        membershipStatus: "revoked",
      }),
    ).toEqual({
      allowed: true,
      redirectTo: null,
    });
  });

  it("returns API auth errors for missing or unauthorized actors", () => {
    expect(resolveApiAccessDecision("/staff/discord-sync", null)).toEqual({
      allowed: false,
      status: 401,
      error: "Authentication required",
    });

    expect(
      resolveApiAccessDecision("/staff/discord-sync", {
        accountRole: "member",
        membershipStatus: "active",
      }),
    ).toEqual({
      allowed: false,
      status: 403,
      error: "Forbidden",
    });

    expect(
      resolveApiAccessDecision("/staff/jobs", {
        accountRole: "member",
        membershipStatus: "active",
      }),
    ).toEqual({
      allowed: false,
      status: 403,
      error: "Forbidden",
    });
  });

  it("allows staff actors through API access checks", () => {
    expect(
      resolveApiAccessDecision("/staff/discord-sync", {
        accountRole: "operations",
        membershipStatus: "revoked",
      }),
    ).toEqual({
      allowed: true,
      status: 200,
      error: null,
    });
  });
});
