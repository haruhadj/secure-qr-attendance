import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role as string | undefined;
    const mustChangePassword = (req.nextauth.token as any)?.mustChangePassword === true;

    // Force users still on a default/temporary password to change it before
    // reaching anything else. /change-password itself and the sign-out flow are
    // exempt so there's no redirect loop.
    if (
      mustChangePassword &&
      pathname !== "/change-password" &&
      !pathname.startsWith("/api/auth")
    ) {
      return NextResponse.redirect(new URL("/change-password", req.nextUrl.origin));
    }
    // Once cleared, keep them out of the forced-change page.
    if (!mustChangePassword && pathname === "/change-password" && role) {
      const home = role === "ADMIN" ? "/admin/dashboard" : role === "TEACHER" ? "/teacher/roster" : "/student/dashboard";
      return NextResponse.redirect(new URL(home, req.nextUrl.origin));
    }

    // Already authenticated users hitting the login page → redirect to their dashboard
    // Use req.nextUrl.origin to build clean URLs without any callbackUrl param
    if (pathname === "/") {
      if (role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", req.nextUrl.origin));
      if (role === "TEACHER") return NextResponse.redirect(new URL("/teacher/roster", req.nextUrl.origin));
      if (role === "STUDENT") return NextResponse.redirect(new URL("/student/dashboard", req.nextUrl.origin));
    }

    // Role-based route enforcement — redirect unauthorized users to login
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }

    if (pathname.startsWith("/teacher") && role !== "TEACHER") {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }

    if (pathname.startsWith("/student") && role !== "STUDENT") {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Let the middleware function above handle all logic.
      // Return true so unauthenticated users on public routes pass through;
      // withAuth will redirect them to the signIn page for protected routes.
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Public routes — always allowed
        if (
          pathname === "/" ||
          pathname.startsWith("/setup") ||
          pathname.startsWith("/forgot-password") ||
          pathname.startsWith("/reset-password") ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/api/health") ||
          pathname.startsWith("/api/cron")
        ) {
          return true;
        }

        // All other routes require a valid token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
