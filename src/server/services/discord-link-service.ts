import { Prisma } from "@prisma/client";
import { z } from "zod";

import { createAuditLog } from "@/lib/audit/logging";
import { prisma } from "@/lib/db/prisma";
import { getDiscordOAuthConfig } from "@/lib/discord/oauth";
import type { EntryStatus, MembershipStatus, RankCode } from "@/lib/lifecycle/enums";
import { BotWebhookPublisher } from "@/server/services/bot-webhook-publisher";

const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.string().min(1),
});

const discordIdentitySchema = z.object({
  id: z.string().min(1),
  username: z.string().min(1),
  global_name: z.string().nullable().optional(),
});

const botWebhookPublisher = new BotWebhookPublisher();

type SyncCandidate = {
  id: string;
  discordId: string | null;
  forumUid: number | null;
  rank: RankCode;
  entryStatus: EntryStatus;
  membershipStatus: MembershipStatus;
  subscriptionExpiresAt: Date | null;
};

export type DiscordLinkSyncEvent =
  | "member.created"
  | "subscription.activated"
  | "subscription.expired"
  | "subscription.decayed"
  | "account.revoked";

export function resolveDiscordLinkSyncEvent(user: Pick<
  SyncCandidate,
  "entryStatus" | "membershipStatus"
>): DiscordLinkSyncEvent {
  if (user.entryStatus === "revoked" || user.membershipStatus === "revoked") {
    return "account.revoked";
  }

  if (user.membershipStatus === "decayed") {
    return "subscription.decayed";
  }

  if (user.membershipStatus === "dormant") {
    return "subscription.expired";
  }

  if (user.membershipStatus === "active") {
    return "subscription.activated";
  }

  return "member.created";
}

export class DiscordLinkError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "oauth_not_configured"
      | "discord_exchange_failed"
      | "discord_identity_failed"
      | "discord_already_linked"
      | "invalid_callback_payload",
  ) {
    super(message);
  }
}

export class DiscordLinkService {
  async linkDiscordAccount(input: { userId: string; code: string }) {
    let config: ReturnType<typeof getDiscordOAuthConfig>;

    try {
      config = getDiscordOAuthConfig();
    } catch {
      throw new DiscordLinkError(
        "Discord OAuth is not configured",
        "oauth_not_configured",
      );
    }

    const token = await this.exchangeCodeForToken(input.code, config);
    const identity = await this.fetchDiscordIdentity(token.access_token, config);

    const existingUser = await prisma.user.findFirst({
      where: {
        discordId: identity.id,
        NOT: { id: input.userId },
      },
      select: { id: true },
    });

    if (existingUser) {
      throw new DiscordLinkError(
        "Discord account is already linked to another forum member",
        "discord_already_linked",
      );
    }

    try {
      const user = await prisma.user.update({
        where: { id: input.userId },
        data: {
          discordId: identity.id,
        },
        select: {
          id: true,
          discordId: true,
          forumUid: true,
          rank: true,
          entryStatus: true,
          membershipStatus: true,
          subscriptionExpiresAt: true,
        },
      });

      await createAuditLog({
        userId: input.userId,
        actorId: input.userId,
        eventType: "discord.account_linked",
        meta: {
          discordUserId: identity.id,
          discordUsername: identity.username,
          discordGlobalName: identity.global_name ?? null,
        },
      });

      const syncEvent = resolveDiscordLinkSyncEvent(user);

      await botWebhookPublisher.publishUserEvent({
        user,
        event: syncEvent,
        actorId: input.userId,
      });

      return {
        user,
        syncEvent,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new DiscordLinkError(
          "Discord account is already linked to another forum member",
          "discord_already_linked",
        );
      }

      throw error;
    }
  }

  async unlinkDiscordAccount(input: { userId: string }) {
    const current = await prisma.user.findUniqueOrThrow({
      where: { id: input.userId },
      select: {
        discordId: true,
      },
    });

    const user = await prisma.user.update({
      where: { id: input.userId },
      data: {
        discordId: null,
      },
      select: {
        id: true,
        discordId: true,
      },
    });

    await createAuditLog({
      userId: input.userId,
      actorId: input.userId,
      eventType: "discord.account_unlinked",
      meta: {
        previousDiscordUserId: current.discordId,
      },
    });

    return user;
  }

  private async exchangeCodeForToken(
    code: string,
    config: ReturnType<typeof getDiscordOAuthConfig>,
  ) {
    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: config.callbackUrl,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new DiscordLinkError(
        "Discord token exchange failed",
        "discord_exchange_failed",
      );
    }

    const payload = tokenResponseSchema.safeParse(await response.json());
    if (!payload.success) {
      throw new DiscordLinkError(
        "Discord token payload was invalid",
        "invalid_callback_payload",
      );
    }

    return payload.data;
  }

  private async fetchDiscordIdentity(
    accessToken: string,
    config: ReturnType<typeof getDiscordOAuthConfig>,
  ) {
    const response = await fetch(config.identityUrl, {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new DiscordLinkError(
        "Discord identity request failed",
        "discord_identity_failed",
      );
    }

    const payload = discordIdentitySchema.safeParse(await response.json());
    if (!payload.success) {
      throw new DiscordLinkError(
        "Discord identity payload was invalid",
        "invalid_callback_payload",
      );
    }

    return payload.data;
  }
}
