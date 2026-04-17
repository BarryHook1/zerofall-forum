import { z } from "zod";

import { requireApiPathAccess } from "@/lib/permissions/guards";
import { StaffService } from "@/server/services/staff-service";

const schema = z.object({
  deliveryId: z.string().uuid(),
});

export async function POST(request: Request) {
  const auth = await requireApiPathAccess("/staff/discord-sync");

  if (!auth.ok) {
    return auth.response;
  }

  const { session } = auth;

  const result = schema.safeParse(await request.json());

  if (!result.success) {
    return Response.json({ error: result.error.flatten() }, { status: 400 });
  }

  const service = new StaffService();
  const delivery = await service.requeueWebhook(result.data.deliveryId, session.user.id);
  return Response.json({ delivery });
}
