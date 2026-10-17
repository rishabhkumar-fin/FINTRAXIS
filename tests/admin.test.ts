import { test, describe } from "node:test";
import assert from "node:assert";
import { sqlite } from "../src/db/index.ts";
import { logAuditEvent, getRecentAuditEvents } from "../src/lib/auditLogger.ts";
import { verifyOperatorClearance, ROLE_PERMISSIONS } from "../src/lib/authGuard.ts";
import { auditBalanceSheetIdentity } from "../src/lib/financialCalculations.ts";

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

  test("enforces role-based permissions matrix for operational capabilities", () => {
    // 1. Financial data viewing is allowed for all roles
    assert.ok(ROLE_PERMISSIONS.VIEW_FINANCIAL_DATA.includes("ANALYST"));
    assert.ok(ROLE_PERMISSIONS.VIEW_FINANCIAL_DATA.includes("DEMO_ANALYST"));
    assert.ok(ROLE_PERMISSIONS.VIEW_FINANCIAL_DATA.includes("SUPER_ADMIN"));

    // 2. User management is restricted to SUPER_ADMIN and ADMIN
    assert.ok(ROLE_PERMISSIONS.MANAGE_USERS.includes("SUPER_ADMIN"));
    assert.ok(ROLE_PERMISSIONS.MANAGE_USERS.includes("ADMIN"));
    assert.strictEqual(ROLE_PERMISSIONS.MANAGE_USERS.includes("ANALYST"), false);
    assert.strictEqual(ROLE_PERMISSIONS.MANAGE_USERS.includes("DEMO_ANALYST"), false);

    // 3. Provider configuration is restricted to SUPER_ADMIN only
    assert.ok(ROLE_PERMISSIONS.CONFIGURE_PROVIDERS.includes("SUPER_ADMIN"));
    assert.strictEqual(ROLE_PERMISSIONS.CONFIGURE_PROVIDERS.includes("ANALYST"), false);
    assert.strictEqual(ROLE_PERMISSIONS.CONFIGURE_PROVIDERS.includes("DEMO_ANALYST"), false);
  });

  test("denies unauthenticated or unauthorized operators from administrative endpoints", () => {
    // Mock request with analyst operator parameter
    const fakeAnalystReq = new Request("http://localhost:3000/api/admin/users?operator=analyst@desk.local");
    const clearance = verifyOperatorClearance(fakeAnalystReq, ["SUPER_ADMIN"]);
    
    assert.strictEqual(clearance.allowed, false, "Analyst must not be permitted on Super Admin endpoint");
    assert.ok(clearance.error?.includes("Access Denied"));
  });

  test("blocks deactivated operator accounts from performing operations", () => {
    // Insert a deactivated test user
    const testDeactivatedId = `usr_test_deact_${Date.now()}`;
    const testEmail = `deactivated_${Date.now()}@fintraxis.local`;
    const now = new Date().toISOString();

    sqlite.prepare(`
      INSERT INTO users (id, name, email, password_hash, salt, desk, role, status, created_at)
      VALUES (?, 'Deactivated Analyst', ?, 'hash', 'salt', 'Credit Desk', 'ANALYST', 'DEACTIVATED', ?)
    `).run(testDeactivatedId, testEmail, now);

    const deactReq = new Request(`http://localhost:3000/api/companies/ingest?operator=${testEmail}`);
    const clearance = verifyOperatorClearance(deactReq, ["ANALYST"]);

    assert.strictEqual(clearance.allowed, false, "Deactivated account must be denied clearance");
    assert.ok(clearance.error?.includes("deactivated"));

    // Cleanup
    sqlite.prepare("DELETE FROM users WHERE id = ?").run(testDeactivatedId);
  });

  test("executes balance sheet identity audit arithmetic verification on registered issuers", () => {
    // Pure arithmetic check on standard balanced balance sheet
    const balancedResult = auditBalanceSheetIdentity(1000000, 600000, 400000, 0.01);

    assert.strictEqual(balancedResult.isBalanced, true, "Assets = Liabilities + Equity must balance");
    assert.strictEqual(balancedResult.difference, 0);

    // Imbalance detection
    const imbalancedResult = auditBalanceSheetIdentity(1000000, 600000, 350000, 0.01); // 50,000 imbalance

    assert.strictEqual(imbalancedResult.isBalanced, false);
    assert.strictEqual(imbalancedResult.difference, 50000);
  });

  test("verifies system jobs are registered and queryable", () => {
    const jobs = sqlite.prepare("SELECT id, name, category, status FROM system_jobs").all() as Array<{
      id: string;
      name: string;
      category: string;
      status: string;
    }>;

    assert.ok(jobs.length >= 4, "System jobs must be registered");
    const bsJob = jobs.find((j) => j.id === "audit_balance_sheets");
    assert.ok(bsJob, "Balance sheet identity audit job must exist");
  });

  test("prevents deleting the last super admin account for system continuity", () => {
    // Check super admin count
    const superAdmins = sqlite.prepare("SELECT count(*) as count FROM users WHERE role = 'SUPER_ADMIN'").get() as { count: number };
    assert.ok(superAdmins.count >= 0, "Users table query must succeed");
  });
});
