import {
  buildJobRequestHeaders,
  buildStaffOpsSmokePlan,
  buildStaffPageHeaders,
  normalizeForumBaseUrl,
} from "@/lib/operations/staff-ops-smoke";

describe("staff ops smoke helpers", () => {
  it("normalizes forum base urls by trimming trailing slashes", () => {
    expect(normalizeForumBaseUrl("https://forum.example/")).toBe(
      "https://forum.example",
    );
    expect(normalizeForumBaseUrl("https://forum.example")).toBe(
      "https://forum.example",
    );
  });

  it("builds the tracked job and staff page targets", () => {
    expect(buildStaffOpsSmokePlan("https://forum.example/")).toEqual({
      jobs: [
        {
          name: "webhook-deliveries",
          path: "/api/internal/jobs/webhook-deliveries",
          url: "https://forum.example/api/internal/jobs/webhook-deliveries",
        },
        {
          name: "activation-expiry",
          path: "/api/internal/jobs/activation-expiry",
          url: "https://forum.example/api/internal/jobs/activation-expiry",
        },
        {
          name: "subscription-expiry",
          path: "/api/internal/jobs/subscription-expiry",
          url: "https://forum.example/api/internal/jobs/subscription-expiry",
        },
        {
          name: "decay",
          path: "/api/internal/jobs/decay",
          url: "https://forum.example/api/internal/jobs/decay",
        },
      ],
      staffPages: [
        {
          name: "staff-home",
          path: "/staff",
          url: "https://forum.example/staff",
        },
        {
          name: "discord-sync",
          path: "/staff/discord-sync",
          url: "https://forum.example/staff/discord-sync",
        },
        {
          name: "jobs",
          path: "/staff/jobs",
          url: "https://forum.example/staff/jobs",
        },
      ],
    });
  });

  it("builds request headers for jobs and optional staff page auth", () => {
    expect(buildJobRequestHeaders("internal-secret")).toEqual({
      "x-internal-job-secret": "internal-secret",
    });

    expect(buildStaffPageHeaders()).toEqual({});
    expect(buildStaffPageHeaders("session=value")).toEqual({
      cookie: "session=value",
    });
  });
});
