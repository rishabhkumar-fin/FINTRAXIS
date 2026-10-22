import { NextResponse } from "next/server";
import { extractSessionFromRequest, createSignedSessionToken, SESSION_COOKIE_NAME } from "@/lib/sessionToken";
import { sqlite } from "@/db/index";

export async function GET(request: Request) {
  try {
    const sessionPayload = extractSessionFromRequest(request);

    if (!sessionPayload) {
      return NextResponse.json(
        { success: false, error: "Your session ended or is invalid. Please sign in again." },
        { status: 401 }
      );
    }

    // If not a demo session, check if user still exists and is not deactivated in DB
    if (!sessionPayload.isDemo && sessionPayload.email) {
      try {
        const userRow = sqlite
          .prepare("SELECT id, name, email, desk, avatar, role, status, net_debt_ebitda_hurdle, interest_coverage_hurdle, current_ratio_hurdle FROM users WHERE email = ?")
          .get(sessionPayload.email.toLowerCase()) as {
            id: string;
            name: string;
            email: string;
            desk: string;
            avatar: string;
            role: string;
            status: string;
            net_debt_ebitda_hurdle: number | null;
            interest_coverage_hurdle: number | null;
            current_ratio_hurdle: number | null;
          } | undefined;

        if (userRow) {
          if (userRow.status === "DEACTIVATED") {
            const resp = NextResponse.json(
              { success: false, error: "Access Denied: This operator account has been deactivated." },
              { status: 403 }
            );
            resp.cookies.set({
              name: SESSION_COOKIE_NAME,
              value: "",
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
              maxAge: 0,
            });
            return resp;
          }

          // Return refreshed state from DB
          return NextResponse.json({
            success: true,
            user: {
              id: userRow.id,
              name: userRow.name,
              email: userRow.email,
              desk: userRow.desk || sessionPayload.desk,
              avatar: userRow.avatar || sessionPayload.avatar,
              role: userRow.role || sessionPayload.role,
              isDemo: false,
              netDebtEbitdaHurdle: userRow.net_debt_ebitda_hurdle ?? sessionPayload.netDebtEbitdaHurdle,
              interestCoverageHurdle: userRow.interest_coverage_hurdle ?? sessionPayload.interestCoverageHurdle,
              currentRatioHurdle: userRow.current_ratio_hurdle ?? sessionPayload.currentRatioHurdle,
              authenticatedAt: sessionPayload.authenticatedAt,
              sessionToken: createSignedSessionToken(sessionPayload),
            },
          });
        }
      } catch (dbErr) {
        console.warn("DB user verification error in /api/auth/me (falling back to signed token):", dbErr);
      }
    }

    // Return verified token payload
    return NextResponse.json({
      success: true,
      user: {
        id: sessionPayload.id,
        name: sessionPayload.name,
        email: sessionPayload.email,
        desk: sessionPayload.desk,
        avatar: sessionPayload.avatar,
        role: sessionPayload.role,
        isDemo: sessionPayload.isDemo,
        netDebtEbitdaHurdle: sessionPayload.netDebtEbitdaHurdle,
        interestCoverageHurdle: sessionPayload.interestCoverageHurdle,
        currentRatioHurdle: sessionPayload.currentRatioHurdle,
        authenticatedAt: sessionPayload.authenticatedAt,
        sessionToken: createSignedSessionToken(sessionPayload),
      },
    });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json(
      { success: false, error: "Authentication verification failed" },
      { status: 500 }
    );
  }
}
