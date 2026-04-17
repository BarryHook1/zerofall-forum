import type { MembershipStatus } from "@/lib/lifecycle/enums";

export function canOpenMembershipCheckout(membershipStatus: MembershipStatus) {
  return membershipStatus !== "revoked";
}

export function isReactivationState(membershipStatus: MembershipStatus) {
  return membershipStatus === "dormant" || membershipStatus === "decayed";
}

export function renewalIntentLabel(membershipStatus: MembershipStatus) {
  if (membershipStatus === "active") {
    return "Open Renewal Checkout";
  }

  if (isReactivationState(membershipStatus)) {
    return "Open Recovery Checkout";
  }

  return "Open Membership Checkout";
}
