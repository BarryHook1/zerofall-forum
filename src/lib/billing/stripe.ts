import Stripe from "stripe";

const globalForStripe = globalThis as typeof globalThis & {
  stripe?: Stripe;
};

export function createStripeClient() {
  const apiKey = process.env.STRIPE_SECRET_KEY;

  if (!apiKey) {
    throw new Error("STRIPE_SECRET_KEY is required");
  }

  return new Stripe(apiKey, {
    apiVersion: "2026-03-25.dahlia",
  });
}

export const stripe = globalForStripe.stripe ?? createStripeClient();

if (process.env.NODE_ENV !== "production") {
  globalForStripe.stripe = stripe;
}
