import { beforeEach, describe, expect, it, vi } from "vitest";

const requireApiPathAccess = vi.fn();
const updateRank = vi.fn();

vi.mock("@/lib/permissions/guards", () => ({
  requireApiPathAccess,
}));

vi.mock("@/server/services/staff-service", () => ({
  StaffService: class {
    updateRank = updateRank;
  },
}));

describe("staff update rank route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("blocks unauthorized update rank requests", async () => {
    requireApiPathAccess.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Forbidden" }, { status: 403 }),
    });

    const { POST } = await import("@/app/api/staff/update-rank/route");
    const response = await POST(
      new Request("https://forum.example/api/staff/update-rank", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: "4b9cf7f8-183f-4f7f-bc42-19861ddaf0e3",
          rank: "elite",
        }),
      }),
    );

    expect(response.status).toBe(403);
    expect(updateRank).not.toHaveBeenCalled();
  });

  it("passes actor context to update rank", async () => {
    requireApiPathAccess.mockResolvedValue({
      ok: true,
      session: {
        user: {
          id: "staff-1",
        },
      },
    });
    updateRank.mockResolvedValue({ id: "user-1", rank: "elite" });

    const { POST } = await import("@/app/api/staff/update-rank/route");
    const response = await POST(
      new Request("https://forum.example/api/staff/update-rank", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: "4b9cf7f8-183f-4f7f-bc42-19861ddaf0e3",
          rank: "elite",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(updateRank).toHaveBeenCalledWith(
      "4b9cf7f8-183f-4f7f-bc42-19861ddaf0e3",
      "elite",
      "staff-1",
    );
  });
});
