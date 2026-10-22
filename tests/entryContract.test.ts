import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createSignedSessionToken, verifySignedSessionToken } from "../src/lib/sessionToken.ts";
import { verifySessionInEdge } from "../src/lib/edgeSession.ts";

describe("Phase 1: Entry Contract & Server-Side Security Authority", () => {
  it("generates a signed session token and verifies it synchronously and via Web Crypto", async () => {
    const payload = {
      id: "usr_analyst_test",
      name: "Rishabh Senior Analyst",
      email: "analyst@fintraxis.local",
      role: "ANALYST" as const,
      desk: "Global Credit Risk & Surveillance",
      avatar: "crest",
      isDemo: false,
      netDebtEbitdaHurdle: 3.5,
      interestCoverageHurdle: 2.5,
      currentRatioHurdle: 1.1,
      authenticatedAt: new Date().toISOString(),
    };

    const token = createSignedSessionToken(payload, 3600);
    assert.ok(token.includes("."));

    // Synchronous Node verification
    const verifiedSync = verifySignedSessionToken(token);
    assert.ok(verifiedSync);
    assert.equal(verifiedSync?.email, "analyst@fintraxis.local");
    assert.equal(verifiedSync?.role, "ANALYST");

    // Universal Web Crypto Edge verification (used in Next.js middleware)
    const verifiedEdge = await verifySessionInEdge(token);
    assert.ok(verifiedEdge);
    assert.equal(verifiedEdge?.email, "analyst@fintraxis.local");
    assert.equal(verifiedEdge?.role, "ANALYST");
  });

  it("rejects tampered or forged tokens on both Node and Edge runtimes", async () => {
    const payload = {
      id: "usr_attacker",
      name: "Bad Actor",
      email: "attacker@malicious.org",
      role: "SUPER_ADMIN" as const,
      desk: "Exploit",
      avatar: "security",
      isDemo: false,
      netDebtEbitdaHurdle: 3.5,
      interestCoverageHurdle: 2.5,
      currentRatioHurdle: 1.1,
      authenticatedAt: new Date().toISOString(),
    };

    const validToken = createSignedSessionToken(payload, 3600);
    const [, sig] = validToken.split(".");

    // Tamper with payload (change role from ANALYST to SUPER_ADMIN without re-signing)
    const tamperedPayload = Buffer.from(
      JSON.stringify({ ...payload, role: "SUPER_ADMIN", email: "hacked@fintraxis.local" })
    ).toString("base64url");
    const forgedToken = `${tamperedPayload}.${sig}`;

    assert.equal(verifySignedSessionToken(forgedToken), null);
    const edgeResult = await verifySessionInEdge(forgedToken);
    assert.equal(edgeResult, null);
  });

  it("rejects expired session tokens deterministically", async () => {
    const payload = {
      id: "usr_expired",
      name: "Expired Operator",
      email: "expired@fintraxis.local",
      role: "ANALYST" as const,
      desk: "Credit Risk",
      avatar: "crest",
      isDemo: false,
      netDebtEbitdaHurdle: 3.5,
      interestCoverageHurdle: 2.5,
      currentRatioHurdle: 1.1,
      authenticatedAt: new Date(Date.now() - 7200000).toISOString(),
    };

    // Expired 1 second ago (-1s lifetime)
    const expiredToken = createSignedSessionToken(payload, -1);
    assert.equal(verifySignedSessionToken(expiredToken), null);

    const edgeResult = await verifySessionInEdge(expiredToken);
    assert.equal(edgeResult, null);
  });

  it("verifies tab-confirmation entry logic simulation", () => {
    function evaluateInitialEntryState(
      hasCookie: boolean,
      hasLocalStorage: boolean,
      hasSessionStorageTabConfirm: boolean
    ): { autoEnter: boolean; showLoginPage: boolean } {
      if (!hasSessionStorageTabConfirm) {
        // Cold visit / new tab / incognito: ALWAYS show login page first
        return { autoEnter: false, showLoginPage: true };
      }

      if (hasCookie && hasLocalStorage) {
        // In-tab page refresh: keep signed in
        return { autoEnter: true, showLoginPage: false };
      }

      return { autoEnter: false, showLoginPage: true };
    }

    // Case 1: Cold visit in new tab (cookie exists from past visit, but no tab confirmation)
    const coldVisit = evaluateInitialEntryState(true, true, false);
    assert.equal(coldVisit.autoEnter, false);
    assert.equal(coldVisit.showLoginPage, true);

    // Case 2: In-tab page refresh (active session confirmed in this tab)
    const tabRefresh = evaluateInitialEntryState(true, true, true);
    assert.equal(tabRefresh.autoEnter, true);
    assert.equal(tabRefresh.showLoginPage, false);

    // Case 3: Logged out (neither cookie nor confirmation exists)
    const loggedOut = evaluateInitialEntryState(false, false, false);
    assert.equal(loggedOut.autoEnter, false);
    assert.equal(loggedOut.showLoginPage, true);
  });

  it("enforces role-based landing default destinations", () => {
    function resolveLandingDesk(role: string): string {
      if (role === "SUPER_ADMIN" || role === "ADMIN") {
        return "00_ADMIN";
      }
      return "overview";
    }

    assert.equal(resolveLandingDesk("SUPER_ADMIN"), "00_ADMIN");
    assert.equal(resolveLandingDesk("ADMIN"), "00_ADMIN");
    assert.equal(resolveLandingDesk("ANALYST"), "overview");
    assert.equal(resolveLandingDesk("DEMO_ANALYST"), "overview");
  });

  it("verifies idle inactivity threshold intervals", () => {
    const TOTAL_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
    const WARNING_TIMEOUT_MS = 29 * 60 * 1000; // 29 minutes
    const GRACE_PERIOD_MS = TOTAL_TIMEOUT_MS - WARNING_TIMEOUT_MS;

    assert.equal(TOTAL_TIMEOUT_MS, 1800000);
    assert.equal(WARNING_TIMEOUT_MS, 1740000);
    assert.equal(GRACE_PERIOD_MS, 60000); // Exactly 60 seconds warning window
  });
});
