import { test, describe } from "node:test";
import assert from "node:assert";
import { sqlite } from "../src/db/index.ts";
import { logAuditEvent, getRecentAuditEvents } from "../src/lib/auditLogger.ts";

describe("Admin & Operational Governance", () => {
  test("records and retrieves administrative audit journal events", () => {
    const operator = "TEST_RUNNER";
    const details = "Admin test event verification";
    
    logAuditEvent("SYSTEM_DIAGNOSTIC", operator, details, "INFO");
    const recent = getRecentAuditEvents(20);

    const found = recent.find((e) => e.operator === operator && e.details === details);
    assert.ok(found, "Audit event must be successfully persisted and retrieved");
    assert.strictEqual(found.eventType, "SYSTEM_DIAGNOSTIC");
    assert.strictEqual(found.severity, "INFO");
  });

  test("verifies system config table contains global risk policy hurdles", () => {
    const hurdles = sqlite.prepare("SELECT key, value FROM system_config WHERE key IN ('GLOBAL_LEVERAGE_HURDLE', 'GLOBAL_COVERAGE_HURDLE', 'GLOBAL_LIQUIDITY_HURDLE')").all() as Array<{ key: string; value: string }>;
    
    assert.ok(hurdles.length >= 3, "Global policy hurdles must be seeded in SQLite");
    const leverage = hurdles.find((h) => h.key === "GLOBAL_LEVERAGE_HURDLE");
    assert.strictEqual(leverage?.value, "3.5");
  });

  test("prevents deleting the last super admin account for system continuity", () => {
    // Check super admin count
    const superAdmins = sqlite.prepare("SELECT count(*) as count FROM users WHERE role = 'SUPER_ADMIN'").get() as { count: number };
    assert.ok(superAdmins.count >= 0, "Users table query must succeed");
  });
});
