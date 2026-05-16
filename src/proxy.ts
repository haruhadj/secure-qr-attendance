import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role as string | undefined;

    // Already authenticated users hitting the login page → redirect to their dashboard
    if (pathname === "/") {
      if (role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      if (role === "TEACHER") return NextResponse.redirect(new URL("/teacher/roster", req.url));
      if (role === "STUDENT") return NextResponse.redirect(new URL("/student/dashboard", req.url));
    }

    // Role-based route enforcement
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (pathname.startsWith("/teacher") && role !== "TEACHER") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (pathname.startsWith("/student") && role !== "STUDENT") {
      return NextResponse.redirect(new URL("/", req.url));
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
          pathname.startsWith("/forgot-password") ||
          pathname.startsWith("/reset-password") ||
          pathname.startsWith("/api/auth")
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
