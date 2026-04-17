import type { Prisma } from "@prisma/client";

import { addHours } from "date-fns";
import { hash } from "bcryptjs";

import { prisma } from "@/lib/db/prisma";
import { stripe } from "@/lib/billing/stripe";
import { BotWebhookPublisher } from "@/server/services/bot-webhook-publisher";
import { UidService } from "@/server/services/uid-service";

const botWebhookPublisher = new BotWebhookPublisher();

export class EntryService {
  async createGenesisCheckout(input: {
    email: string;
    username: string;
    password: string;
    origin: string;
  }) {
    const passwordHash = await hash(input.password, 10);
    const purchase = await prisma.entryPurchase.create({
      data: {
        provider: "stripe",
        email: input.email.trim().toLowerCase(),
        requestedUsername: input.username.trim(),
        requestedPasswordHash: passwordHash,
        amount: 0,
        currency: "usd",
        status: "pending",
      },
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: purchase.email,
      success_url: `${input.origin}/dashboard?entry=success`,
      cancel_url: `${input.origin}/genesis?entry=canceled`,
      line_items: [
        {
          price: process.env.STRIPE_ENTRY_PRICE_ID!,
          quantity: 1,
        },
      ],
      metadata: {
        kind: "entry",
        purchaseId: purchase.id,
      },
    });

    await prisma.entryPurchase.update({
      where: { id: purchase.id },
      data: {
        providerCheckoutSessionId: session.id,
      },
    });

    return session;
  }

  async provisionFromCheckoutSession(checkoutSession: {
    id: string;
    payment_intent?: string | null;
    amount_total?: number | null;
    currency?: string | null;
  }) {
    const existingPurchase = await prisma.entryPurchase.findFirst({
      where: { providerCheckoutSessionId: checkoutSession.id },
      include: { user: true },
    });

    if (!existingPurchase) {
      throw new Error("Entry purchase not found for checkout session");
    }

    if (existingPurchase.user) {
      return existingPurchase.user;
    }

    const user = await prisma.$transaction(async (tx) => {
      const purchase = await tx.entryPurchase.findUnique({
        where: { id: existingPurchase.id },
      });

      if (!purchase) {
        throw new Error("Entry purchase disappeared during provisioning");
      }

      if (purchase.userId) {
        const existingUser = await tx.user.findUnique({
          where: { id: purchase.userId },
        });

        if (!existingUser) {
          throw new Error("Provisioned user not found");
        }

        return existingUser;
      }

      const uidService = new UidService({
        async getForumSequence() {
          return tx.uidSequence.findUniqueOrThrow({
            where: { name: "forum_uid" },
          });
        },
        async updateForumSequence(nextValue) {
          await tx.uidSequence.update({
            where: { name: "forum_uid" },
            data: { currentValue: nextValue },
          });
        },
      });

      const forumUid = await uidService.issueNextUid({
        purchase: { status: "paid" },
        user: { forumUid: null },
      });
      const activationDeadline = addHours(new Date(), 72);
      const user = await tx.user.create({
        data: {
          username: purchase.requestedUsername,
          email: purchase.email,
          passwordHash: purchase.requestedPasswordHash,
          forumUid,
          entryStatus: "entry_confirmed",
          membershipStatus: "awaiting_activation",
          rank: "genesis_founder",
          badgeStatus: "enabled",
          activationDeadline,
        },
      });

      await tx.entryPurchase.update({
        where: { id: purchase.id },
        data: {
          userId: user.id,
          status: "paid",
          providerPaymentId: checkoutSession.payment_intent ?? null,
          amount: checkoutSession.amount_total ?? purchase.amount,
          currency: checkoutSession.currency?.toUpperCase() ?? purchase.currency,
          paidAt: new Date(),
        },
      });

      await tx.activationWindow.create({
        data: {
          userId: user.id,
          deadlineAt: activationDeadline,
        },
      });

      await tx.auditLog.createMany({
        data: [
          {
            userId: user.id,
            eventType: "entry.payment_confirmed",
            metaJson: { purchaseId: purchase.id } as Prisma.InputJsonValue,
          },
          {
            userId: user.id,
            eventType: "entry.uid_issued",
            metaJson: { forumUid } as Prisma.InputJsonValue,
          },
          {
            userId: user.id,
            eventType: "entry.account_created",
            metaJson: { username: user.username } as Prisma.InputJsonValue,
          },
          {
            userId: user.id,
            eventType: "entry.activation_deadline_created",
            metaJson: {
              activationDeadline: activationDeadline.toISOString(),
            } as Prisma.InputJsonValue,
          },
        ],
      });

      return user;
    });

    await botWebhookPublisher.publishUserEvent({
      user,
      event: "member.created",
    });

    return user;
  }
}
