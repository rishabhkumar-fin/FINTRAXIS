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

    // If explicit guest / demo access requested, issue isolated read-only demo session
    if (isDemoRequest) {
      const guestAccessEnabled =
        process.env.GUEST_ACCESS_ENABLED !== "false" &&
        process.env.DEMO_ACCESS_ENABLED !== "false";

      if (!guestAccessEnabled) {
        return NextResponse.json(
          { success: false, error: "Guest demo access is currently disabled on this deployment." },
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

      logAuditEvent("DEMO_SESSION", "Guest", "Guest (read-only demo) session initiated", "INFO");
      const response = NextResponse.json({
        success: true,
        message: "Guest session initiated",
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
        { success: false, error: "Email or username and password are required." },
        { status: 400 }
      );
    }

    // Rate limiting check
    const rateLimit = checkAuthRateLimit(identifier);
    if (!rateLimit.allowed) {
      const cooldownSec = rateLimit.retryAfterSeconds ?? 60;
      const minutes = Math.ceil(cooldownSec / 60);
      logAuditEvent("RATE_LIMIT_BLOCK", identifier, `Rate limit breached. Cooldown: ${cooldownSec}s`, "CRITICAL");
      return NextResponse.json(
        {
          success: false,
          error: `Too many failed attempts. Please try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`,
          retryAfter: cooldownSec,
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

    // Support Admin Bootstrap credentials from environment variable if configured
    const adminBootstrapSecret = process.env.ADMIN_BOOTSTRAP_PASSWORD || process.env.ADMIN_PASSWORD;
    const isAdminIdentifier = identifier === "admin" || identifier === "admin@fintraxis.local" || identifier === "admin@fintraxis.terminal";

    if (!user && isAdminIdentifier && adminBootstrapSecret && password === adminBootstrapSecret) {
      const salt = crypto.randomBytes(16).toString("hex");
      const passwordHash = crypto
        .pbkdf2Sync(password, salt, 10000, 64, "sha512")
        .toString("hex");

      const bootstrapAdmin = {
        id: `usr_${crypto.randomBytes(8).toString("hex")}`,
        name: "Institutional Administrator",
        email: "admin@fintraxis.local",
        passwordHash,
        salt,
        desk: "Global Systems & Risk Governance",
        avatar: "security",
        netDebtEbitdaHurdle: 3.50,
        interestCoverageHurdle: 2.50,
        currentRatioHurdle: 1.10,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        mustChangePassword: 0,
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      try {
        db.insert(users).values(bootstrapAdmin).run();
        user = bootstrapAdmin;
      } catch (insertErr) {
        console.warn("Bootstrap admin insert caught:", insertErr);
      }
    }

    if (!user) {
      recordFailedAuthAttempt(identifier);
      logAuditEvent("AUTH_FAILED", identifier, "Account identifier not found in registry", "WARNING");
      return NextResponse.json(
        { success: false, error: "Incorrect email or password." },
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

    let isMatch =
      testBuf.length === storedBuf.length && crypto.timingSafeEqual(testBuf, storedBuf);

    // Also allow bootstrap secret override for admin if defined
    if (!isMatch && isAdminIdentifier && adminBootstrapSecret && password === adminBootstrapSecret) {
      isMatch = true;
    }

    if (!isMatch) {
      recordFailedAuthAttempt(identifier);
      logAuditEvent("AUTH_FAILED", identifier, "Cryptographic hash verification failed", "WARNING");
      return NextResponse.json(
        { success: false, error: "Incorrect email or password." },
        { status: 401 }
      );
    }

    // Reset rate limiter on successful authentication
    resetAuthRateLimit(identifier);

    // Check if account still uses known default seed password
    const isKnownDefaultPassword = password === "admin123" || password === "analyst123";
    const mustChangePassword = Boolean(user.mustChangePassword === 1 || (isKnownDefaultPassword && user.role !== "DEMO_ANALYST"));

    const isGuest = user.role === "DEMO_ANALYST" || user.email.startsWith("guest@");
    const userRole = (user.role || (isAdminIdentifier ? "SUPER_ADMIN" : "ANALYST")) as "SUPER_ADMIN" | "ADMIN" | "LEAD_ANALYST" | "ANALYST" | "DEMO_ANALYST";
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
    });

    try {
      db.update(users)
        .set({
          lastLoginAt: nowIso,
          mustChangePassword: mustChangePassword ? 1 : 0,
        })
        .where(eq(users.id, user.id))
        .run();
    } catch {
      // Non-fatal if read-only filesystem
    }

    logAuditEvent("AUTH_LOGIN", user.name, `Operator signed in (${userRole})`, "INFO");

    const sessionPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      desk: user.desk,
      avatar: user.avatar,
      role: userRole,
      isDemo: isGuest,
      mustChangePassword,
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
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json(
      { success: false, error: "Internal authentication service error" },
      { status: 500 }
    );
  }
}
