import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { stripe } from "@/lib/billing/stripe";
import { BotWebhookPublisher } from "@/server/services/bot-webhook-publisher";

const botWebhookPublisher = new BotWebhookPublisher();

export class MembershipService {
  async createMembershipCheckout(input: { userId: string; origin: string }) {
    const user = await prisma.user.findUnique({ where: { id: input.userId } });
    if (!user) {
      throw new Error("User not found");
    }

    if (user.entryStatus !== "entry_confirmed" || user.membershipStatus === "revoked") {
      throw new Error("User is not eligible to purchase membership");
    }

    return stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      success_url: `${input.origin}/dashboard?membership=success`,
      cancel_url: `${input.origin}/membership?membership=canceled`,
      line_items: [
        {
          price: process.env.STRIPE_MEMBERSHIP_PRICE_ID!,
          quantity: 1,
        },
      ],
      metadata: {
        kind: "membership",
        userId: user.id,
      },
    });
  }

  async activateFromSubscription(input: {
    userId: string;
    providerSubscriptionId: string;
    currentPeriodEnd?: number | null;
  }) {
    const expiresAt = input.currentPeriodEnd
      ? new Date(input.currentPeriodEnd * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const user = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: input.userId } });
      if (!user) {
        throw new Error("User not found for subscription activation");
      }

      await tx.subscription.upsert({
        where: { providerSubscriptionId: input.providerSubscriptionId },
        update: {
          status: "active",
          expiresAt,
        },
        create: {
          userId: user.id,
          planCode: "core_membership",
          provider: "stripe",
          providerSubscriptionId: input.providerSubscriptionId,
          status: "active",
          startsAt: new Date(),
          expiresAt,
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          membershipStatus: "active",
          subscriptionExpiresAt: expiresAt,
        },
      });

      await tx.activationWindow.updateMany({
        where: {
          userId: user.id,
          activatedAt: null,
        },
        data: {
          activatedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          eventType: "membership.activated",
          metaJson: {
            providerSubscriptionId: input.providerSubscriptionId,
          } as Prisma.InputJsonValue,
        },
      });

      return tx.user.findUniqueOrThrow({ where: { id: user.id } });
    });

    await botWebhookPublisher.publishUserEvent({
      user,
      event: "subscription.activated",
    });

    return user;
  }

  async expireSubscription(providerSubscriptionId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { providerSubscriptionId },
      include: { user: true },
    });

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    const user = await prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { providerSubscriptionId },
        data: {
          status: "expired",
          expiresAt: new Date(),
        },
      });
      await tx.user.update({
        where: { id: subscription.userId },
        data: {
          membershipStatus: "dormant",
          decayState: "dormant",
          subscriptionExpiresAt: new Date(),
        },
      });
      await tx.auditLog.create({
        data: {
          userId: subscription.userId,
          eventType: "membership.expired",
          metaJson: { providerSubscriptionId } as Prisma.InputJsonValue,
        },
      });
      return tx.user.findUniqueOrThrow({ where: { id: subscription.userId } });
    });

    await botWebhookPublisher.publishUserEvent({
      user,
      event: "subscription.expired",
    });

    return user;
  }
}
