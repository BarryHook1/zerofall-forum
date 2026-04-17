import { redirect } from "next/navigation";

import { getAppSession } from "@/lib/auth/session";
import { canAccessPath, type RouteActor } from "@/lib/permissions/access";

export function resolveAccessDecision(
  pathname: string,
  actor?: RouteActor | null,
) {
  if (!actor) {
    return {
      allowed: false,
      redirectTo: `/login?callbackUrl=${encodeURIComponent(pathname)}`,
    };
  }

  if (canAccessPath(actor, pathname)) {
    return { allowed: true, redirectTo: null };
  }

  return {
    allowed: false,
    redirectTo: actor.accountRole !== "member" ? "/staff" : "/dashboard",
  };
}

export function resolveApiAccessDecision(
  pathname: string,
  actor?: RouteActor | null,
) {
  if (!actor) {
    return {
      allowed: false,
      status: 401,
      error: "Authentication required",
    };
  }

  if (canAccessPath(actor, pathname)) {
    return {
      allowed: true,
      status: 200,
      error: null,
    };
  }

  return {
    allowed: false,
    status: 403,
    error: "Forbidden",
  };
}

export async function requirePathAccess(pathname: string) {
  const session = await getAppSession();
  const actor = session?.user
    ? {
        accountRole: session.user.accountRole,
        membershipStatus: session.user.membershipStatus,
      }
    : null;
  const decision = resolveAccessDecision(pathname, actor);

  if (!decision.allowed && decision.redirectTo) {
    redirect(decision.redirectTo);
  }

  return session;
}

export async function requireApiPathAccess(pathname: string) {
  const session = await getAppSession();
  const actor = session?.user
    ? {
        accountRole: session.user.accountRole,
        membershipStatus: session.user.membershipStatus,
      }
    : null;
  const decision = resolveApiAccessDecision(pathname, actor);

  if (!decision.allowed) {
    return {
      ok: false as const,
      response: Response.json(
        { error: decision.error },
        { status: decision.status },
      ),
    };
  }

  return {
    ok: true as const,
    session: session!,
  };
}
