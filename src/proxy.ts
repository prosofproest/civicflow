import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie = request.cookies.get("civicflow_session")?.value;
  const roleCookie = request.cookies.get("civicflow_role")?.value;
  const modeCookie = request.cookies.get("civicflow_mode")?.value;
  const demoRoleCookie = request.cookies.get("civicflow_demo_role")?.value;

  const isDemo =
    modeCookie === "demo" ||
    Boolean(demoRoleCookie) ||
    sessionCookie?.startsWith("demo_") === true ||
    sessionCookie === "demo_token";

  const effectiveRole = isDemo ? (demoRoleCookie || roleCookie || "citizen") : roleCookie;

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password");

  const isProtectedRoute =
    pathname.startsWith("/citizen") ||
    pathname.startsWith("/officer") ||
    pathname.startsWith("/admin");

  // 1. Unauthenticated users attempting to access protected routes
  if (isProtectedRoute && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated users attempting to access auth forms (login/register)
  if (isAuthRoute && sessionCookie) {
    if (effectiveRole === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (effectiveRole === "officer") {
      return NextResponse.redirect(new URL("/officer", request.url));
    }
    return NextResponse.redirect(new URL("/citizen", request.url));
  }

  // 3. Role-based access control for protected routes
  if (sessionCookie && effectiveRole) {
    // Only admins can access /admin
    if (pathname.startsWith("/admin") && effectiveRole !== "admin") {
      if (effectiveRole === "officer") {
        return NextResponse.redirect(new URL("/officer", request.url));
      }
      return NextResponse.redirect(new URL("/citizen", request.url));
    }

    // Only officers and admins can access /officer
    if (pathname.startsWith("/officer") && effectiveRole === "citizen") {
      return NextResponse.redirect(new URL("/citizen", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/citizen/:path*",
    "/officer/:path*",
    "/admin/:path*",
    "/login",
    "/register",
    "/forgot-password",
  ],
};
