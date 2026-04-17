export const entryStatuses = [
  "visitor",
  "entry_pending",
  "entry_confirmed",
  "revoked",
] as const;

export const membershipStatuses = [
  "none",
  "awaiting_activation",
  "active",
  "dormant",
  "decayed",
  "revoked",
] as const;

export const rankCodes = [
  "none",
  "verified",
  "elite",
  "vanguard",
  "genesis_founder",
] as const;

export const badgeStatuses = ["disabled", "enabled"] as const;

export const decayStates = ["none", "dormant", "decayed"] as const;

export type EntryStatus = (typeof entryStatuses)[number];
export type MembershipStatus = (typeof membershipStatuses)[number];
export type RankCode = (typeof rankCodes)[number];
export type BadgeStatus = (typeof badgeStatuses)[number];
export type DecayState = (typeof decayStates)[number];

export type UserLifecycleStatus =
  | "visitor"
  | "entry_pending"
  | "entry_confirmed"
  | "awaiting_activation"
  | "active"
  | "dormant"
  | "decayed"
  | "revoked";
