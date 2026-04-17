function matchesSharedSecret(request: Request) {
  const secret = request.headers.get("x-internal-job-secret");
  return Boolean(secret && secret === process.env.INTERNAL_JOB_SECRET);
}

function matchesCronSecret(request: Request) {
  const authorization = request.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!authorization || !expectedSecret) {
    return false;
  }

  return authorization === `Bearer ${expectedSecret}`;
}

export function authorizeJobRequest(request: Request) {
  return matchesSharedSecret(request) || matchesCronSecret(request);
}

