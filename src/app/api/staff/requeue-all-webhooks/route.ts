import { requireApiPathAccess } from "@/lib/permissions/guards";
import { StaffService } from "@/server/services/staff-service";

export async function POST() {
  const auth = await requireApiPathAccess("/staff/discord-sync");

  if (!auth.ok) {
    return auth.response;
  }

  const service = new StaffService();
  const result = await service.requeueAllFailedWebhooks(auth.session.user.id);

  return Response.json({ result });
}
