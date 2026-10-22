import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionInEdge } from "@/lib/edgeSession";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Administrative API protection
  if (pathname.startsWith("/api/admin")) {
    const token =
      request.cookies.get(SESSION_COOKIE_NAME)?.value ||
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      request.headers.get("x-session-token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store, max-age=0, must-revalidate",
            Pragma: "no-cache",
          },
        }
      );
    }

    const session = await verifySessionInEdge(token);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session expired or invalid. Please sign in again." },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store, max-age=0, must-revalidate",
            Pragma: "no-cache",
          },
        }
      );
    }

    const isAdmin = session.role === "SUPER_ADMIN" || session.role === "ADMIN";
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Access Denied: Administrative clearance required." },
        {
          status: 403,
          headers: {
            "Cache-Control": "no-store, max-age=0, must-revalidate",
            Pragma: "no-cache",
          },
        }
      );
    }
  }

  // 2. Strict no-store headers on sensitive routes
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  return response;
}

export const config = {
  matcher: [
    "/api/admin/:path*",
    "/api/audit/:path*",
    "/api/auth/me",
    "/admin",
  ],
};
