import { MembershipService } from "@/server/services/membership-service";
import { requireAppSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const session = await requireAppSession();
  const service = new MembershipService();
  const checkoutSession = await service.createMembershipCheckout({
    userId: session.user.id,
    origin: new URL(request.url).origin,
  });

  return Response.redirect(checkoutSession.url!, 303);
}
