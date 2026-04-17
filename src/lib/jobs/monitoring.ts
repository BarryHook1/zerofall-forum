import { prisma } from "@/lib/db/prisma";

export const internalJobNames = [
  "activation-expiry",
  "subscription-expiry",
  "decay",
  "webhook-deliveries",
] as const;

export type InternalJobName = (typeof internalJobNames)[number];

export type InternalJobTrigger = "cron" | "internal_secret" | "unknown";

export function detectJobTrigger(request: Request): InternalJobTrigger {
  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    return "cron";
  }

  if (request.headers.has("x-internal-job-secret")) {
    return "internal_secret";
  }

  return "unknown";
}

export async function runMonitoredJob({
  jobName,
  trigger,
  run,
}: {
  jobName: InternalJobName;
  trigger: InternalJobTrigger;
  run: () => Promise<number>;
}) {
  const jobRun = await prisma.jobRun.create({
    data: {
      jobName,
      status: "running",
    },
  });

  void trigger;

  try {
    const processed = await run();

    await prisma.jobRun.update({
      where: { id: jobRun.id },
      data: {
        status: "succeeded",
        processedCount: processed,
        finishedAt: new Date(),
        errorSummary: null,
      },
    });

    return processed;
  } catch (error) {
    await prisma.jobRun.update({
      where: { id: jobRun.id },
      data: {
        status: "failed",
        processedCount: 0,
        finishedAt: new Date(),
        errorSummary:
          error instanceof Error ? error.message.slice(0, 240) : "Unknown job error",
      },
    });

    throw error;
  }
}
