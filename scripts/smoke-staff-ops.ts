import {
  buildJobRequestHeaders,
  buildStaffOpsSmokePlan,
  buildStaffPageHeaders,
} from "@/lib/operations/staff-ops-smoke";

type SmokeResult = {
  name: string;
  url: string;
  status: number;
  ok: boolean;
  body: string;
};

async function readBody(response: Response) {
  const text = await response.text();
  return text.length > 300 ? `${text.slice(0, 300)}...` : text;
}

async function checkJob(
  name: string,
  url: string,
  secret: string,
): Promise<SmokeResult> {
  const response = await fetch(url, {
    method: "POST",
    headers: buildJobRequestHeaders(secret),
  });

  return {
    name,
    url,
    status: response.status,
    ok: response.ok,
    body: await readBody(response),
  };
}

async function checkStaffPage(
  name: string,
  url: string,
  staffCookie?: string,
): Promise<SmokeResult> {
  const response = await fetch(url, {
    headers: buildStaffPageHeaders(staffCookie),
  });

  return {
    name,
    url,
    status: response.status,
    ok: response.ok,
    body: await readBody(response),
  };
}

function printResult(result: SmokeResult) {
  const prefix = result.ok ? "PASS" : "FAIL";
  console.log(`${prefix} ${result.name} ${result.status} ${result.url}`);

  if (!result.ok || result.body.length > 0) {
    console.log(result.body);
  }
}

async function main() {
  const forumBaseUrl = process.env.FORUM_BASE_URL;
  const internalJobSecret = process.env.INTERNAL_JOB_SECRET;
  const staffCookie = process.env.STAFF_COOKIE;

  if (!forumBaseUrl) {
    throw new Error("FORUM_BASE_URL is required");
  }

  if (!internalJobSecret) {
    throw new Error("INTERNAL_JOB_SECRET is required");
  }

  const plan = buildStaffOpsSmokePlan(forumBaseUrl);

  console.log(`Running job smoke test against ${forumBaseUrl}`);
  for (const job of plan.jobs) {
    const result = await checkJob(job.name, job.url, internalJobSecret);
    printResult(result);

    if (!result.ok) {
      process.exitCode = 1;
    }
  }

  if (!staffCookie) {
    console.log("Skipping staff page checks because STAFF_COOKIE is not set.");
    return;
  }

  console.log("Running authenticated staff page smoke test");
  for (const page of plan.staffPages) {
    const result = await checkStaffPage(page.name, page.url, staffCookie);
    printResult(result);

    if (!result.ok) {
      process.exitCode = 1;
    }
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unknown smoke test failure");
  process.exitCode = 1;
});
