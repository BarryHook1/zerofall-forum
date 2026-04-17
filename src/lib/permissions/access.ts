import type { MembershipStatus } from "@/lib/lifecycle/enums";

export type AccountRole =
  | "member"
  | "founder"
  | "admin"
  | "operations"
  | "billing"
  | "moderator"
  | "support";

export type RouteActor = {
  accountRole: AccountRole;
  membershipStatus: MembershipStatus;
};

const PUBLIC_PATHS = ["/", "/genesis", "/login", "/status", "/faq"];
const AWAITING_ACTIVATION_PATHS = [
  "/dashboard",
  "/welcome",
  "/rules",
  "/activation",
  "/membership",
  "/billing",
  "/account-standing",
];
const ACTIVE_PATHS = [
  "/dashboard",
  "/welcome",
  "/rules",
  "/activation",
  "/membership",
  "/billing",
  "/renewals",
  "/reactivation",
  "/account-standing",
  "/uid",
  "/ranks",
  "/badges",
];
const DORMANT_PATHS = [
  "/dashboard",
  "/billing",
  "/renewals",
  "/reactivation",
  "/account-standing",
  "/uid",
  "/ranks",
  "/badges",
];
const DECAYED_PATHS = [
  "/dashboard",
  "/billing",
  "/reactivation",
  "/account-standing",
  "/uid",
  "/ranks",
  "/badges",
];

export function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.includes(pathname);
}

export function isStaffRole(role: AccountRole) {
  return role !== "member";
}

export function canAccessPath(actor: RouteActor, pathname: string) {
  if (isPublicPath(pathname)) {
    return true;
  }

  if (pathname.startsWith("/staff")) {
    return isStaffRole(actor.accountRole);
  }

  if (isStaffRole(actor.accountRole)) {
    return true;
  }

  const allowedPaths =
    actor.membershipStatus === "awaiting_activation"
      ? AWAITING_ACTIVATION_PATHS
      : actor.membershipStatus === "active"
        ? ACTIVE_PATHS
        : actor.membershipStatus === "dormant"
          ? DORMANT_PATHS
          : actor.membershipStatus === "decayed"
            ? DECAYED_PATHS
            : [];

  return allowedPaths.includes(pathname);
}
