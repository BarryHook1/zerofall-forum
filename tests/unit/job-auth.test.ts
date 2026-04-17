import { authorizeJobRequest } from "@/lib/jobs/auth";

describe("job request authorization", () => {
  it("accepts the internal job secret header", () => {
    process.env.INTERNAL_JOB_SECRET = "internal-secret";
    process.env.CRON_SECRET = "cron-secret";

    const request = new Request("https://forum.example/api/internal/jobs/webhook-deliveries", {
      method: "POST",
      headers: {
        "x-internal-job-secret": "internal-secret",
      },
    });

    expect(authorizeJobRequest(request)).toBe(true);
  });

  it("accepts the bearer cron secret", () => {
    process.env.INTERNAL_JOB_SECRET = "internal-secret";
    process.env.CRON_SECRET = "cron-secret";

    const request = new Request("https://forum.example/api/internal/jobs/webhook-deliveries", {
      method: "GET",
      headers: {
        authorization: "Bearer cron-secret",
      },
    });

    expect(authorizeJobRequest(request)).toBe(true);
  });

  it("rejects requests without a matching secret", () => {
    process.env.INTERNAL_JOB_SECRET = "internal-secret";
    process.env.CRON_SECRET = "cron-secret";

    const request = new Request("https://forum.example/api/internal/jobs/webhook-deliveries", {
      method: "GET",
    });

    expect(authorizeJobRequest(request)).toBe(false);
  });
});
