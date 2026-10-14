import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import {
  checkAuthRateLimit,
  recordFailedAuthAttempt,
  resetAuthRateLimit,
  createDemoSession,
} from "../src/lib/authRateLimit.ts";

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
});
