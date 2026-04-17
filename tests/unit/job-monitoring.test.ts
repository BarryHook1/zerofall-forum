import { beforeEach, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    jobRun: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: prismaMock,
}));

import { detectJobTrigger, runMonitoredJob } from "@/lib/jobs/monitoring";
import { summarizeJobRunMeta } from "@/server/queries/staff-job-runs";

describe("job monitoring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("detects cron and internal job triggers", () => {
    expect(
      detectJobTrigger(
        new Request("https://forum.example/api/internal/jobs/decay", {
          headers: {
            authorization: "Bearer cron-secret",
          },
        }),
      ),
    ).toBe("cron");

    expect(
      detectJobTrigger(
        new Request("https://forum.example/api/internal/jobs/decay", {
          headers: {
            "x-internal-job-secret": "internal-secret",
          },
        }),
      ),
    ).toBe("internal_secret");
  });

  it("summarizes a recorded job run", () => {
    expect(
      summarizeJobRunMeta({
        jobName: "webhook-deliveries",
        trigger: "cron",
        status: "failed",
        processed: 0,
        error: "Webhook returned HTTP 500",
        startedAt: "2026-04-14T21:00:00.000Z",
        finishedAt: "2026-04-14T21:00:02.000Z",
      }),
    ).toEqual({
      jobName: "webhook-deliveries",
      trigger: "cron",
      status: "failed",
      processed: 0,
      error: "Webhook returned HTTP 500",
      startedAt: "2026-04-14T21:00:00.000Z",
      finishedAt: "2026-04-14T21:00:02.000Z",
    });
  });

  it("persists a running then succeeded job run", async () => {
    prismaMock.jobRun.create.mockResolvedValue({
      id: "run-1",
    });
    prismaMock.jobRun.update.mockResolvedValue(undefined);

    const result = await runMonitoredJob({
      jobName: "decay",
      trigger: "cron",
      run: async () => 4,
    });

    expect(result).toBe(4);
    expect(prismaMock.jobRun.create).toHaveBeenCalledWith({
      data: {
        jobName: "decay",
        status: "running",
      },
    });
    expect(prismaMock.jobRun.update).toHaveBeenCalledWith({
      where: { id: "run-1" },
      data: expect.objectContaining({
        status: "succeeded",
        processedCount: 4,
        errorSummary: null,
        finishedAt: expect.any(Date),
      }),
    });
  });

  it("persists a failed job run and rethrows the error", async () => {
    prismaMock.jobRun.create.mockResolvedValue({
      id: "run-2",
    });
    prismaMock.jobRun.update.mockResolvedValue(undefined);

    await expect(
      runMonitoredJob({
        jobName: "webhook-deliveries",
        trigger: "internal_secret",
        run: async () => {
          throw new Error("Webhook returned HTTP 500");
        },
      }),
    ).rejects.toThrow("Webhook returned HTTP 500");

    expect(prismaMock.jobRun.update).toHaveBeenCalledWith({
      where: { id: "run-2" },
      data: expect.objectContaining({
        status: "failed",
        processedCount: 0,
        errorSummary: "Webhook returned HTTP 500",
        finishedAt: expect.any(Date),
      }),
    });
  });
});
