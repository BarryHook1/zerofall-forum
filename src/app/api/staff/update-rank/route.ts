import { z } from "zod";

import { requireApiPathAccess } from "@/lib/permissions/guards";
import { StaffService } from "@/server/services/staff-service";

const schema = z.object({
  userId: z.string().uuid(),
  rank: z.enum(["none", "verified", "elite", "vanguard", "genesis_founder"]),
});

export async function POST(request: Request) {
  const auth = await requireApiPathAccess("/staff");

  if (!auth.ok) {
    return auth.response;
  }

  const { session } = auth;
  const result = schema.safeParse(await request.json());

  if (!result.success) {
    return Response.json({ error: result.error.flatten() }, { status: 400 });
  }

  const service = new StaffService();
  const user = await service.updateRank(
    result.data.userId,
    result.data.rank,
    session.user.id,
  );
  return Response.json({ user });
}
