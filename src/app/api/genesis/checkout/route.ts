import { z } from "zod";

import { EntryService } from "@/server/services/entry-service";

const formSchema = z.object({
  username: z.string().min(3),
  email: z.email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const result = formSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return Response.json(
      { error: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const service = new EntryService();
  const origin = new URL(request.url).origin;
  const session = await service.createGenesisCheckout({
    ...result.data,
    origin,
  });

  return Response.redirect(session.url!, 303);
}
