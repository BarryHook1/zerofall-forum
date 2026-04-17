import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      email: string;
      username: string;
      forumUid: number | null;
      accountRole:
        | "member"
        | "founder"
        | "admin"
        | "operations"
        | "billing"
        | "moderator"
        | "support";
      entryStatus: "visitor" | "entry_pending" | "entry_confirmed" | "revoked";
      membershipStatus:
        | "none"
        | "awaiting_activation"
        | "active"
        | "dormant"
        | "decayed"
        | "revoked";
      rank:
        | "none"
        | "verified"
        | "elite"
        | "vanguard"
        | "genesis_founder";
      badgeStatus: "disabled" | "enabled";
      activationDeadline?: string | null;
      subscriptionExpiresAt?: string | null;
      discordId?: string | null;
    };
  }

  interface User {
    id: string;
    username: string;
    forumUid: number | null;
    accountRole:
      | "member"
      | "founder"
      | "admin"
      | "operations"
      | "billing"
      | "moderator"
      | "support";
    entryStatus: "visitor" | "entry_pending" | "entry_confirmed" | "revoked";
    membershipStatus:
      | "none"
      | "awaiting_activation"
      | "active"
      | "dormant"
      | "decayed"
      | "revoked";
    rank:
      | "none"
      | "verified"
      | "elite"
      | "vanguard"
      | "genesis_founder";
    badgeStatus: "disabled" | "enabled";
    activationDeadline?: string | null;
    subscriptionExpiresAt?: string | null;
    discordId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    forumUid?: number | null;
    accountRole?:
      | "member"
      | "founder"
      | "admin"
      | "operations"
      | "billing"
      | "moderator"
      | "support";
    entryStatus?: "visitor" | "entry_pending" | "entry_confirmed" | "revoked";
    membershipStatus?:
      | "none"
      | "awaiting_activation"
      | "active"
      | "dormant"
      | "decayed"
      | "revoked";
    rank?:
      | "none"
      | "verified"
      | "elite"
      | "vanguard"
      | "genesis_founder";
    badgeStatus?: "disabled" | "enabled";
    activationDeadline?: string | null;
    subscriptionExpiresAt?: string | null;
    discordId?: string | null;
  }
}
