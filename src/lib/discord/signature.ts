import { createHmac, randomUUID } from "node:crypto";

export function createForumWebhookSignature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function createForumDeliveryId() {
  return randomUUID();
}

export function computeWebhookBackoffMs(attemptCount: number) {
  return Math.min(2 ** attemptCount * 30_000, 15 * 60_000);
}
