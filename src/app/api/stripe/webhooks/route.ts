import Stripe from "stripe";

import { stripe } from "@/lib/billing/stripe";
import { EntryService } from "@/server/services/entry-service";
import { MembershipService } from "@/server/services/membership-service";

function getCheckoutSessionMetadata(session: Stripe.Checkout.Session) {
  return session.metadata ?? {};
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return new Response("Missing Stripe webhook configuration", { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "Invalid signature", {
      status: 400,
    });
  }

  const entryService = new EntryService();
  const membershipService = new MembershipService();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = getCheckoutSessionMetadata(session);

      if (metadata.kind === "entry") {
        await entryService.provisionFromCheckoutSession({
          id: session.id,
          payment_intent:
            typeof session.payment_intent === "string" ? session.payment_intent : null,
          amount_total: session.amount_total,
          currency: session.currency,
        });
      }

      if (metadata.kind === "membership" && metadata.userId && typeof session.subscription === "string") {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        await membershipService.activateFromSubscription({
          userId: metadata.userId,
          providerSubscriptionId: subscription.id,
          currentPeriodEnd: subscription.items.data[0]?.current_period_end ?? null,
        });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata.userId;
      if (userId) {
        await membershipService.activateFromSubscription({
          userId,
          providerSubscriptionId: subscription.id,
          currentPeriodEnd: subscription.items.data[0]?.current_period_end ?? null,
        });
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await membershipService.expireSubscription(subscription.id);
      break;
    }
    default:
      break;
  }

  return Response.json({ received: true });
}
