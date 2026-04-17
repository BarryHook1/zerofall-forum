import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth/config";

export async function getAppSession() {
  return getServerSession(authOptions);
}

export async function requireAppSession() {
  const session = await getAppSession();

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}
