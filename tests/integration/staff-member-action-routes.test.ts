import { beforeEach, describe, expect, it, vi } from "vitest";

const requireApiPathAccess = vi.fn();
const revokeUser = vi.fn();
const reactivateUser = vi.fn();

vi.mock("@/lib/permissions/guards", () => ({
  requireApiPathAccess,
}));

vi.mock("@/server/services/staff-service", () => ({
  StaffService: class {
    revokeUser = revokeUser;
    reactivateUser = reactivateUser;
  },
}));

describe("staff member action routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("blocks unauthorized revoke requests", async () => {
    requireApiPathAccess.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Forbidden" }, { status: 403 }),
    });

    const { POST } = await import("@/app/api/staff/revoke-user/route");
    const response = await POST(
      new Request("https://forum.example/api/staff/revoke-user", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: "4b9cf7f8-183f-4f7f-bc42-19861ddaf0e3" }),
      }),
    );

    expect(response.status).toBe(403);
    expect(revokeUser).not.toHaveBeenCalled();
  });

  it("passes actor context to revoke and reactivate operations", async () => {
    requireApiPathAccess.mockResolvedValue({
      ok: true,
      session: {
        user: {
          id: "staff-1",
        },
      },
    });
    revokeUser.mockResolvedValue({ id: "user-1" });
    reactivateUser.mockResolvedValue({ id: "user-1" });

    const { POST: revoke } = await import("@/app/api/staff/revoke-user/route");
    const revokeResponse = await revoke(
      new Request("https://forum.example/api/staff/revoke-user", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: "4b9cf7f8-183f-4f7f-bc42-19861ddaf0e3" }),
      }),
    );

    expect(revokeResponse.status).toBe(200);
    expect(revokeUser).toHaveBeenCalledWith(
      "4b9cf7f8-183f-4f7f-bc42-19861ddaf0e3",
      "staff-1",
    );

    const { POST: reactivate } = await import("@/app/api/staff/reactivate-user/route");
    const reactivateResponse = await reactivate(
      new Request("https://forum.example/api/staff/reactivate-user", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: "4b9cf7f8-183f-4f7f-bc42-19861ddaf0e3" }),
      }),
    );

    expect(reactivateResponse.status).toBe(200);
    expect(reactivateUser).toHaveBeenCalledWith(
      "4b9cf7f8-183f-4f7f-bc42-19861ddaf0e3",
      "staff-1",
    );
  });
});
