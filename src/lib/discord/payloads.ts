import type { RankCode } from "@/lib/lifecycle/enums";

export const botWebhookEvents = [
  "member.created",
  "subscription.activated",
  "subscription.expired",
  "subscription.decayed",
  "rank.granted",
  "rank.revoked",
  "account.revoked",
] as const;

export type BotWebhookEvent = (typeof botWebhookEvents)[number];

type ForumUserPayload = {
  id: string;
  forumUid: number | null;
  discordId: string | null;
  rank: RankCode;
  subscriptionExpiresAt?: Date | null;
};

export type BotWebhookPayload = {
  type: BotWebhookEvent;
  event: BotWebhookEvent;
  discordUserId: string;
  uid: string;
  forumMemberId: string;
  timestamp: string;
  rank?: RankCode;
  expiresAt?: string | null;
};

type MappedWebhookInput =
  | "member.created"
  | "subscription.activated"
  | "subscription.expired"
  | "subscription.decayed"
  | "account.revoked"
  | "member.reactivated"
  | "rank.updated";

export function formatBotWebhookUid(uid: number | null | undefined) {
  if (!uid || uid < 1) {
    return null;
  }

  return `UID${String(uid).padStart(4, "0")}`;
}

export function mapForumEventToBotEvent(
  event: MappedWebhookInput,
  rank: RankCode,
): BotWebhookEvent {
  switch (event) {
    case "member.created":
      return "member.created";
    case "subscription.activated":
    case "member.reactivated":
      return "subscription.activated";
    case "subscription.expired":
      return "subscription.expired";
    case "subscription.decayed":
      return "subscription.decayed";
    case "account.revoked":
      return "account.revoked";
    case "rank.updated":
      return rank === "none" ? "rank.revoked" : "rank.granted";
  }
}

export function buildBotWebhookPayload(
  event: MappedWebhookInput,
  user: ForumUserPayload,
  timestamp = new Date(),
): BotWebhookPayload | null {
  if (!user.discordId) {
    return null;
  }

  const uid = formatBotWebhookUid(user.forumUid);
  if (!uid) {
    return null;
  }

  const botEvent = mapForumEventToBotEvent(event, user.rank);

  return {
    type: botEvent,
    event: botEvent,
    discordUserId: user.discordId,
    uid,
    forumMemberId: user.id,
    timestamp: timestamp.toISOString(),
    ...(botEvent === "subscription.activated" ||
    botEvent === "rank.granted" ||
    botEvent === "rank.revoked"
      ? { rank: user.rank }
      : {}),
    ...(botEvent === "subscription.activated" ||
    botEvent === "subscription.expired" ||
    botEvent === "subscription.decayed"
      ? { expiresAt: user.subscriptionExpiresAt?.toISOString() ?? null }
      : {}),
  };
}
