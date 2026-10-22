import { test, describe } from "node:test";
import assert from "node:assert";
import { checkAuthRateLimit, recordFailedAuthAttempt, resetAuthRateLimit } from "../src/lib/authRateLimit.ts";
import { verifyOperatorClearance } from "../src/lib/authGuard.ts";
import { createSignedSessionToken } from "../src/lib/sessionToken.ts";

describe("Stage 3: Authentication & Security Integrity Tests", () => {
  test("1. Unauthenticated request without session or credentials is denied access to admin endpoints", () => {
    const unauthReq = new Request("http://localhost:3000/api/admin/users", {
      method: "GET",
    });

    const clearance = verifyOperatorClearance(unauthReq, ["SUPER_ADMIN", "ADMIN"]);
    assert.strictEqual(clearance.allowed, false);
    assert.match(clearance.error || "", /Access Denied|Unauthenticated/);
  });

  test("2. Rate limiting triggers after repeated failed authentication attempts (429)", () => {
    const testUser = "security_test_lockout@fintraxis.internal";
    resetAuthRateLimit(testUser);

    // Initial check should be allowed
    let check = checkAuthRateLimit(testUser);
    assert.strictEqual(check.allowed, true);

    // Record 5 failed attempts (lockout threshold)
    for (let i = 0; i < 5; i++) {
      recordFailedAuthAttempt(testUser);
    }

    // Next check must be rejected with retryAfterSeconds > 0
    check = checkAuthRateLimit(testUser);
    assert.strictEqual(check.allowed, false);
    assert.ok(check.retryAfterSeconds > 0, "Expected retryAfterSeconds > 0");

    // Clean up
    resetAuthRateLimit(testUser);
  });

  test("3. Demo role operator is blocked from administrative configuration endpoints (403)", () => {
    // Generate valid signed token for a demo user
    const demoToken = createSignedSessionToken({
      id: "demo_guest_99",
      name: "Demo Analyst",
      email: "guest@fintraxis.internal",
      desk: "Demo Sandbox",
      avatar: "crest",
      role: "DEMO_ANALYST",
      isDemo: true,
      netDebtEbitdaHurdle: 3.5,
      interestCoverageHurdle: 2.5,
      currentRatioHurdle: 1.1,
      authenticatedAt: new Date().toISOString(),
    });

    const demoReq = new Request("http://localhost:3000/api/admin/config", {
      method: "POST",
      headers: {
        cookie: `fintraxis_session=${demoToken}`,
      },
    });

    // Admin endpoints require ["SUPER_ADMIN", "ADMIN", "LEAD_ANALYST"]
    const adminClearance = verifyOperatorClearance(demoReq, ["SUPER_ADMIN", "ADMIN", "LEAD_ANALYST"]);
    assert.strictEqual(adminClearance.allowed, false);
    assert.strictEqual(adminClearance.isDemo, true);
    assert.match(adminClearance.error || "", /sandbox mode/);

    // But demo analyst is allowed to view financial data
    const viewClearance = verifyOperatorClearance(demoReq, ["SUPER_ADMIN", "ADMIN", "LEAD_ANALYST", "ANALYST", "DEMO_ANALYST"]);
    assert.strictEqual(viewClearance.allowed, true);
  });

  test("4. Normal analyst role is blocked from executing user administration", () => {
    const analystToken = createSignedSessionToken({
      id: "analyst_01",
      name: "Standard Analyst",
      email: "analyst@fintraxis.internal",
      desk: "Credit Desk",
      avatar: "crest",
      role: "ANALYST",
      isDemo: false,
      netDebtEbitdaHurdle: 3.5,
      interestCoverageHurdle: 2.5,
      currentRatioHurdle: 1.1,
      authenticatedAt: new Date().toISOString(),
    });

    const req = new Request("http://localhost:3000/api/admin/users", {
      method: "POST",
      headers: {
        cookie: `fintraxis_session=${analystToken}`,
      },
    });

    // User management requires ["SUPER_ADMIN", "ADMIN"]
    const clearance = verifyOperatorClearance(req, ["SUPER_ADMIN", "ADMIN"]);
    assert.strictEqual(clearance.allowed, false);
    assert.match(clearance.error || "", /does not have permission/);
  });
});
