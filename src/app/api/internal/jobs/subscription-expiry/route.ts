import { processSubscriptionExpiryJob } from "@/server/jobs/process-subscription-expiry";
import { authorizeJobRequest } from "@/lib/jobs/auth";
import { detectJobTrigger, runMonitoredJob } from "@/lib/jobs/monitoring";

async function handle(request: Request) {
  if (!authorizeJobRequest(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const processed = await runMonitoredJob({
    jobName: "subscription-expiry",
    trigger: detectJobTrigger(request),
    run: () => processSubscriptionExpiryJob(),
  });
  return Response.json({ processed });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
