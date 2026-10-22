import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import {
  checkAuthRateLimit,
  recordFailedAuthAttempt,
  resetAuthRateLimit,
  createDemoSession,
} from "../src/lib/authRateLimit.ts";
import {
  createSignedSessionToken,
  verifySignedSessionToken,
  extractSessionFromRequest,
} from "../src/lib/sessionToken.ts";
import { verifyOperatorClearance } from "../src/lib/authGuard.ts";

describe("Phase 1: Authentication & Security Hardening", () => {
  it("generates timing-safe PBKDF2 hash and verifies correctly", () => {
    const password = "Secur3P@ssword2026!";
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto
      .pbkdf2Sync(password, salt, 10000, 64, "sha512")
      .toString("hex");

    // Valid check
    const checkHash = crypto
      .pbkdf2Sync(password, salt, 10000, 64, "sha512")
      .toString("hex");
    const validMatch = crypto.timingSafeEqual(
      Buffer.from(checkHash, "hex"),
      Buffer.from(hash, "hex")
    );
    assert.equal(validMatch, true);

    // Invalid check
    const badHash = crypto
      .pbkdf2Sync("WrongPassword", salt, 10000, 64, "sha512")
      .toString("hex");
    const badMatch = crypto.timingSafeEqual(
      Buffer.from(badHash, "hex"),
      Buffer.from(hash, "hex")
    );
    assert.equal(badMatch, false);
  });

  it("enforces brute-force rate limiting and lockout after 5 failed attempts", () => {
    const testIdentifier = `analyst_test_${Date.now()}@fintraxis.local`;

    // Initially allowed with 5 remaining attempts
    let status = checkAuthRateLimit(testIdentifier);
    assert.equal(status.allowed, true);
    assert.equal(status.remainingAttempts, 5);

    // Simulate 4 failed attempts
    for (let i = 0; i < 4; i++) {
      recordFailedAuthAttempt(testIdentifier);
    }
    status = checkAuthRateLimit(testIdentifier);
    assert.equal(status.allowed, true);
    assert.equal(status.remainingAttempts, 1);

    // 5th failed attempt triggers lockout
    recordFailedAuthAttempt(testIdentifier);
    status = checkAuthRateLimit(testIdentifier);
    assert.equal(status.allowed, false);
    assert.equal(status.remainingAttempts, 0);
    assert.ok(status.retryAfterSeconds! > 0);

    // Successful reset restores access
    resetAuthRateLimit(testIdentifier);
    status = checkAuthRateLimit(testIdentifier);
    assert.equal(status.allowed, true);
    assert.equal(status.remainingAttempts, 5);
  });

  it("creates an explicitly identified demo session with write restrictions", () => {
    const demo = createDemoSession();
    assert.equal(demo.isDemo, true);
    assert.equal(demo.role, "DEMO_ANALYST");
    assert.equal(demo.writeRestricted, true);
    assert.equal(demo.email, "demo@fintraxis.terminal");
    assert.ok(demo.sessionToken.startsWith("DEMO-"));
    assert.ok(demo.notice.includes("DEMO SESSION"));
  });

  it("generates and verifies stateless signed session token", () => {
    const payload = {
      id: "usr_test_analyst",
      name: "Sarah Jenkins",
      email: "sarah@desk.local",
      role: "ANALYST" as const,
      desk: "Credit Risk",
      avatar: "crest",
      isDemo: false,
      netDebtEbitdaHurdle: 3.5,
      interestCoverageHurdle: 2.5,
      currentRatioHurdle: 1.1,
      authenticatedAt: new Date().toISOString(),
    };

    const token = createSignedSessionToken(payload, 3600);
    assert.ok(token.includes("."));

    const decoded = verifySignedSessionToken(token);
    assert.ok(decoded);
    assert.equal(decoded.id, payload.id);
    assert.equal(decoded.role, "ANALYST");

    // Tampered token returns null
    const tampered = token.slice(0, -4) + "AAAA";
    assert.equal(verifySignedSessionToken(tampered), null);

    // Expired token returns null
    const expiredToken = createSignedSessionToken(payload, -10);
    assert.equal(verifySignedSessionToken(expiredToken), null);
  });

  it("extracts session from Cookie header and enforces server-side role check", () => {
    const analystPayload = {
      id: "usr_analyst",
      name: "Risk Analyst",
      email: "analyst@bank.local",
      role: "ANALYST" as const,
      desk: "Credit Desk",
      avatar: "crest",
      isDemo: false,
      netDebtEbitdaHurdle: 3.5,
      interestCoverageHurdle: 2.5,
      currentRatioHurdle: 1.1,
      authenticatedAt: new Date().toISOString(),
    };

    const token = createSignedSessionToken(analystPayload);

    // Request with analyst cookie accessing admin endpoint
    const req = new Request("http://localhost:3000/api/admin/users", {
      headers: {
        cookie: `fintraxis_session=${token}`,
      },
    });

    const session = extractSessionFromRequest(req);
    assert.ok(session);
    assert.equal(session.role, "ANALYST");

    // Server-side guard denies analyst on admin endpoint
    const clearance = verifyOperatorClearance(req, ["SUPER_ADMIN", "ADMIN"]);
    assert.equal(clearance.allowed, false);
    assert.ok(clearance.error?.includes("Access Denied"));
  });

  it("grants admin clearance when admin signed token is present", () => {
    const adminPayload = {
      id: "usr_admin",
      name: "Global Admin",
      email: "admin@fintraxis.local",
      role: "SUPER_ADMIN" as const,
      desk: "Risk Oversight",
      avatar: "crest",
      isDemo: false,
      netDebtEbitdaHurdle: 3.5,
      interestCoverageHurdle: 2.5,
      currentRatioHurdle: 1.1,
      authenticatedAt: new Date().toISOString(),
    };

    const token = createSignedSessionToken(adminPayload);
    const req = new Request("http://localhost:3000/api/admin/users", {
      headers: {
        cookie: `fintraxis_session=${token}`,
      },
    });

    const clearance = verifyOperatorClearance(req, ["SUPER_ADMIN", "ADMIN"]);
    assert.equal(clearance.allowed, true);
    assert.equal(clearance.role, "SUPER_ADMIN");
  });

  it("handles URL search parameter state resolution deterministically", () => {
    const validUrl = "http://localhost:3000/?tab=02_HEALTH&company=RELIANCE.NS";
    const parsed = new URL(validUrl);
    assert.equal(parsed.searchParams.get("tab"), "02_HEALTH");
    assert.equal(parsed.searchParams.get("company"), "RELIANCE.NS");

    const fallbackUrl = "http://localhost:3000/";
    const parsedFallback = new URL(fallbackUrl);
    assert.equal(parsedFallback.searchParams.get("tab"), null);
    assert.equal(parsedFallback.searchParams.get("company"), null);
  });
});
