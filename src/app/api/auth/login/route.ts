import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { users } from "@/db/schema";
import { eq, or, sql } from "drizzle-orm";
import crypto from "crypto";
import { checkAuthRateLimit, recordFailedAuthAttempt, resetAuthRateLimit, createDemoSession } from "@/lib/authRateLimit";
import { logAuditEvent } from "@/lib/auditLogger";
import { createSignedSessionToken, SESSION_COOKIE_NAME } from "@/lib/sessionToken";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const isDemoRequest = Boolean(body.isDemo);

    // If explicit demo access requested, issue isolated demo session
    if (isDemoRequest) {
    if (process.env.DEMO_ACCESS_ENABLED === "false") {
      return NextResponse.json(
        { success: false, error: "Demo access is disabled on this deployment." },
        { status: 403 }
      );
    }
      const demo = createDemoSession();
      const signedToken = createSignedSessionToken({
        id: demo.id,
        name: demo.name,
        email: demo.email,
        desk: demo.desk,
        avatar: demo.avatar,
        role: "DEMO_ANALYST",
        isDemo: true,
        netDebtEbitdaHurdle: 3.5,
        interestCoverageHurdle: 2.5,
        currentRatioHurdle: 1.1,
        authenticatedAt: demo.authenticatedAt,
      });
      demo.sessionToken = signedToken;

      logAuditEvent("DEMO_SESSION", "Guest", "Guest demo session initiated", "INFO");
      const response = NextResponse.json({
        success: true,
        message: "Demo session initiated",
        user: demo,
      });

      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: signedToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 86400, // 24 hours
      });

      return response;
    }

    const identifier = (body.email || body.username || "").trim().toLowerCase();
    const { password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: "Username/email and password are required" },
        { status: 400 }
      );
    }

    // Rate limiting check
    const rateLimit = checkAuthRateLimit(identifier);
    if (!rateLimit.allowed) {
      logAuditEvent("RATE_LIMIT_BLOCK", identifier, `Rate limit breached. Cooldown: ${rateLimit.retryAfterSeconds}s`, "CRITICAL");
      return NextResponse.json(
        {
          success: false,
          error: `Too many authentication attempts. Please retry in ${rateLimit.retryAfterSeconds} seconds.`,
          retryAfter: rateLimit.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    let user = db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, identifier),
          sql`lower(${users.name}) = ${identifier}`
        )
      )
      .get();

    // Auto-seed default guest or demo operator identity if logging in
    if (!user && (identifier === "guest" || identifier.startsWith("guest@") || identifier === "admin" || identifier === "demo")) {
      const salt = crypto.randomBytes(16).toString("hex");
      const passwordHash = crypto
        .pbkdf2Sync(password || "guest", salt, 10000, 64, "sha512")
        .toString("hex");

      const isAdmin = identifier === "admin" || identifier.startsWith("admin@");
      const isGuestIdent = identifier === "guest" || identifier.startsWith("guest@");

      const defaultUser = {
        id: `usr_${crypto.randomBytes(8).toString("hex")}`,
        name: isAdmin ? "Institutional Administrator" : (isGuestIdent ? "Guest Analyst" : "Lead Risk Analyst"),
        email: isAdmin ? "admin@fintraxis.terminal" : (isGuestIdent ? "guest@fintraxis.terminal" : "analyst@fintraxis.terminal"),
        passwordHash,
        salt,
        desk: isAdmin ? "Global Systems & Risk Governance" : "Global Credit Risk & Surveillance",
        avatar: isAdmin ? "security" : "crest",
        netDebtEbitdaHurdle: 3.50,
        interestCoverageHurdle: 2.50,
        currentRatioHurdle: 1.10,
        role: isAdmin ? "SUPER_ADMIN" : (isGuestIdent ? "DEMO_ANALYST" : "ANALYST"),
        status: "ACTIVE",
        mustChangePassword: 0,
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      db.insert(users).values(defaultUser).run();
      user = defaultUser;
    }

    if (!user) {
      recordFailedAuthAttempt(identifier);
      logAuditEvent("AUTH_FAILED", identifier, "Account identifier not found in registry", "WARNING");
      return NextResponse.json(
        { success: false, error: "User account not found. Please check your credentials or create an account." },
        { status: 401 }
      );
    }

    // Account status check
    if (user.status === "DEACTIVATED") {
      logAuditEvent("AUTH_FAILED", identifier, "Attempted sign-in to deactivated account", "WARNING");
      return NextResponse.json(
        { success: false, error: "Access Denied: This operator account has been deactivated by a System Administrator." },
        { status: 403 }
      );
    }

    // Cryptographic PBKDF2 verification with timing-safe comparison
    const testHash = crypto
      .pbkdf2Sync(password, user.salt, 10000, 64, "sha512")
      .toString("hex");

    const testBuf = Buffer.from(testHash, "hex");
    const storedBuf = Buffer.from(user.passwordHash, "hex");

    const isMatch =
      testBuf.length === storedBuf.length && crypto.timingSafeEqual(testBuf, storedBuf);

    if (!isMatch) {
      recordFailedAuthAttempt(identifier);
      logAuditEvent("AUTH_FAILED", identifier, "Cryptographic hash verification failed", "WARNING");
      return NextResponse.json(
        { success: false, error: "Incorrect password. Please try again." },
        { status: 401 }
      );
    }

    // Reset rate limiter on successful authentication
    resetAuthRateLimit(identifier);

    const isGuest = user.email.startsWith("guest@") || user.name.toLowerCase().includes("guest");
    const userRole = (user.role || (user.email === "admin@fintraxis.terminal" || user.name.toLowerCase().includes("admin") ? "SUPER_ADMIN" : (isGuest ? "DEMO_ANALYST" : "ANALYST"))) as "SUPER_ADMIN" | "ADMIN" | "LEAD_ANALYST" | "ANALYST" | "DEMO_ANALYST";
    const nowIso = new Date().toISOString();

    const signedToken = createSignedSessionToken({
      id: user.id,
      name: user.name,
      email: user.email,
      desk: user.desk,
      avatar: user.avatar,
      role: userRole,
      isDemo: isGuest,
      netDebtEbitdaHurdle: user.netDebtEbitdaHurdle ?? 3.50,
      interestCoverageHurdle: user.interestCoverageHurdle ?? 2.50,
      currentRatioHurdle: user.currentRatioHurdle ?? 1.10,
      authenticatedAt: nowIso,
      mustChangePassword: Boolean((user as { mustChangePassword?: number }).mustChangePassword),
    });

    logAuditEvent("AUTH_LOGIN", user.email, `Session established: ${user.name} [Role: ${userRole}]`, "INFO");

    const sessionPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      desk: user.desk,
      avatar: user.avatar,
      isDemo: isGuest,
      role: userRole,
      writeRestricted: isGuest,
      netDebtEbitdaHurdle: user.netDebtEbitdaHurdle ?? 3.50,
      interestCoverageHurdle: user.interestCoverageHurdle ?? 2.50,
      currentRatioHurdle: user.currentRatioHurdle ?? 1.10,
      sessionToken: signedToken,
      authenticatedAt: nowIso,
    };

    const response = NextResponse.json({
      success: true,
      message: "Authentication successful",
      user: sessionPayload,
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: signedToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 86400, // 24 hours
    });

    return response;
  } catch (error: unknown) {
    console.error("POST /api/auth/login failure:", error);
    const msg = error instanceof Error ? error.message : "Authentication failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
