export const trackedJobTargets = [
  {
    name: "webhook-deliveries",
    path: "/api/internal/jobs/webhook-deliveries",
  },
  {
    name: "activation-expiry",
    path: "/api/internal/jobs/activation-expiry",
  },
  {
    name: "subscription-expiry",
    path: "/api/internal/jobs/subscription-expiry",
  },
  {
    name: "decay",
    path: "/api/internal/jobs/decay",
  },
] as const;

export const trackedStaffPages = [
  {
    name: "staff-home",
    path: "/staff",
  },
  {
    name: "discord-sync",
    path: "/staff/discord-sync",
  },
  {
    name: "jobs",
    path: "/staff/jobs",
  },
] as const;

export function normalizeForumBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

export function buildStaffOpsSmokePlan(baseUrl: string) {
  const normalizedBaseUrl = normalizeForumBaseUrl(baseUrl);

  return {
    jobs: trackedJobTargets.map((target) => ({
      ...target,
      url: `${normalizedBaseUrl}${target.path}`,
    })),
    staffPages: trackedStaffPages.map((target) => ({
      ...target,
      url: `${normalizedBaseUrl}${target.path}`,
    })),
  };
}

export function buildJobRequestHeaders(secret: string) {
  return {
    "x-internal-job-secret": secret,
  } satisfies Record<string, string>;
}

export function buildStaffPageHeaders(staffCookie?: string): Record<string, string> {
  if (!staffCookie) {
    return {};
  }

  return {
    cookie: staffCookie,
  };
}
