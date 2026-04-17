import { beforeEach, describe, expect, it, vi } from "vitest";

const requireApiPathAccess = vi.fn();
const requeueAllFailedWebhooks = vi.fn();

vi.mock("@/lib/permissions/guards", () => ({
  requireApiPathAccess,
}));

vi.mock("@/server/services/staff-service", () => ({
  StaffService: class {
    requeueAllFailedWebhooks = requeueAllFailedWebhooks;
  },
}));

describe("staff webhook bulk requeue route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns the auth guard response for unauthorized requests", async () => {
    requireApiPathAccess.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Forbidden" }, { status: 403 }),
    });

    const { POST } = await import("@/app/api/staff/requeue-all-webhooks/route");
    const response = await POST(
      new Request("https://forum.example/api/staff/requeue-all-webhooks", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(403);
    expect(requeueAllFailedWebhooks).not.toHaveBeenCalled();
  });

  it("requeues all failed deliveries for authorized staff", async () => {
    requireApiPathAccess.mockResolvedValue({
      ok: true,
      session: {
        user: {
          id: "staff-1",
        },
      },
    });
    requeueAllFailedWebhooks.mockResolvedValue({
      count: 6,
    });

    const { POST } = await import("@/app/api/staff/requeue-all-webhooks/route");
    const response = await POST(
      new Request("https://forum.example/api/staff/requeue-all-webhooks", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      result: {
        count: 6,
      },
    });
    expect(requireApiPathAccess).toHaveBeenCalledWith("/staff/discord-sync");
    expect(requeueAllFailedWebhooks).toHaveBeenCalledTimes(1);
  });

  it("keeps the legacy bulk route aligned with the canonical response", async () => {
    requireApiPathAccess.mockResolvedValue({
      ok: true,
      session: {
        user: {
          id: "staff-1",
        },
      },
    });
    requeueAllFailedWebhooks.mockResolvedValue({
      count: 2,
    });

    const { POST } = await import("@/app/api/staff/requeue-failed-webhooks/route");
    const response = await POST(
      new Request("https://forum.example/api/staff/requeue-failed-webhooks", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      result: {
        count: 2,
      },
    });
  });
});
