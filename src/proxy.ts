import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import { getAuthSecret } from "@/lib/auth/env";
import { canAccessPath, isPublicPath, isStaffRole } from "@/lib/permissions/access";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: getAuthSecret(),
  });

  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const actor = {
    accountRole: token.accountRole ?? "member",
    membershipStatus: token.membershipStatus ?? "none",
  };

  if (!canAccessPath(actor, pathname)) {
    return NextResponse.redirect(
      new URL(isStaffRole(actor.accountRole) ? "/staff" : "/dashboard", request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
