import { processActivationExpiryJob } from "@/server/jobs/process-activation-expiry";
import { authorizeJobRequest } from "@/lib/jobs/auth";
import { detectJobTrigger, runMonitoredJob } from "@/lib/jobs/monitoring";

async function handle(request: Request) {
  if (!authorizeJobRequest(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const processed = await runMonitoredJob({
    jobName: "activation-expiry",
    trigger: detectJobTrigger(request),
    run: () => processActivationExpiryJob(),
  });
  return Response.json({ processed });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
