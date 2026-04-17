import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

export type AuthUserSnapshot = {
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
  activationDeadline: string | null;
  subscriptionExpiresAt: string | null;
  discordId: string | null;
};

export function mapUserRecordToAuthSnapshot(user: {
  id: string;
  email: string;
  username: string;
  forumUid: number | null;
  accountRole: AuthUserSnapshot["accountRole"];
  entryStatus: AuthUserSnapshot["entryStatus"];
  membershipStatus: AuthUserSnapshot["membershipStatus"];
  rank: AuthUserSnapshot["rank"];
  badgeStatus: AuthUserSnapshot["badgeStatus"];
  activationDeadline: Date | null;
  subscriptionExpiresAt: Date | null;
  discordId: string | null;
}): AuthUserSnapshot {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    forumUid: user.forumUid,
    accountRole: user.accountRole,
    entryStatus: user.entryStatus,
    membershipStatus: user.membershipStatus,
    rank: user.rank,
    badgeStatus: user.badgeStatus,
    activationDeadline: user.activationDeadline?.toISOString() ?? null,
    subscriptionExpiresAt: user.subscriptionExpiresAt?.toISOString() ?? null,
    discordId: user.discordId,
  };
}

export function applyAuthSnapshotToToken(token: JWT, user: AuthUserSnapshot) {
  token.id = user.id;
  token.email = user.email;
  token.name = user.username;
  token.username = user.username;
  token.forumUid = user.forumUid;
  token.accountRole = user.accountRole;
  token.entryStatus = user.entryStatus;
  token.membershipStatus = user.membershipStatus;
  token.rank = user.rank;
  token.badgeStatus = user.badgeStatus;
  token.activationDeadline = user.activationDeadline;
  token.subscriptionExpiresAt = user.subscriptionExpiresAt;
  token.discordId = user.discordId;

  return token;
}

export function applyTokenToSession(session: Session, token: JWT) {
  if (!session.user || !token.id || !token.email || !token.username) {
    return session;
  }

  session.user.id = token.id;
  session.user.email = token.email;
  session.user.name = token.name;
  session.user.username = token.username;
  session.user.forumUid = token.forumUid ?? null;
  session.user.accountRole = token.accountRole ?? "member";
  session.user.entryStatus = token.entryStatus ?? "visitor";
  session.user.membershipStatus = token.membershipStatus ?? "none";
  session.user.rank = token.rank ?? "none";
  session.user.badgeStatus = token.badgeStatus ?? "disabled";
  session.user.activationDeadline = token.activationDeadline ?? null;
  session.user.subscriptionExpiresAt = token.subscriptionExpiresAt ?? null;
  session.user.discordId = token.discordId ?? null;

  return session;
}
