import { WebhookDeliveryService } from "@/server/services/webhook-delivery-service";

export async function processWebhookDeliveriesJob() {
  const service = new WebhookDeliveryService();
  return service.processPendingDeliveries();
}
