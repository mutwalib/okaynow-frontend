import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROLE_PREFIX: Record<string, string> = {
  caregiver: "CAREGIVER",
  client: "CLIENT",
  facility: "FACILITY",
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segment = pathname.split("/")[1];
  const requiredRole = ROLE_PREFIX[segment];
  if (!requiredRole) return NextResponse.next();

  const role = request.cookies.get("on-auth-role")?.value;
  if (!role) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (role !== requiredRole) {
    const home =
      role === "CAREGIVER"
        ? "/caregiver"
        : role === "CLIENT"
          ? "/client"
          : role === "FACILITY"
            ? "/facility"
            : "/";
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/caregiver/:path*", "/client/:path*", "/facility/:path*"],
};
