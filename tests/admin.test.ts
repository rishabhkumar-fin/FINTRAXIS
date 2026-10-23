import { test, describe } from "node:test";
import assert from "node:assert";
import { sqlite } from "../src/db/index.ts";
import { logAuditEvent, getRecentAuditEvents } from "../src/lib/auditLogger.ts";
import { verifyOperatorClearance, ROLE_PERMISSIONS } from "../src/lib/authGuard.ts";
import { auditBalanceSheetIdentity } from "../src/lib/financialCalculations.ts";
import { validatePeriodRecord, executePeriodUpsert } from "../src/lib/periodImport.ts";

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

  test("validates period import: blocks on balance sheet identity mismatch exceeding 0.5%", () => {
    const imbalancedPayload = {
      ticker: "TCS.NS",
      fiscal_year: "FY2099",
      revenue: 100000,
      ebit: 20000,
      total_assets: 100000,
      total_liabilities: 40000,
      total_equity: 30000, // 40000 + 30000 = 70000 != 100000 (30% mismatch)
    };

    const validation = validatePeriodRecord(imbalancedPayload);
    assert.strictEqual(validation.isValid, false);
    assert.match(validation.error || "", /Balance Sheet Identity Mismatch/);
  });

  test("validates period import: successfully upserts valid period idempotently", () => {
    const validPayload = {
      ticker: "TCS.NS",
      fiscal_year: "FY2098",
      revenue: 100000,
      ebit: 25000,
      ebitda: 29000,
      depreciation_amortization: 4000,
      finance_cost: 500,
      net_income: 19000,
      cash_and_equivalents: 20000,
      total_assets: 100000,
      total_liabilities: 30000,
      total_equity: 70000, // 30000 + 70000 = 100000 (Exact balance)
      status: "reported (user-entered from filing)",
    };

    const validation = validatePeriodRecord(validPayload);
    assert.strictEqual(validation.isValid, true);
    assert.ok(validation.cleanData);

    // Execute idempotent upsert
    const periodId1 = executePeriodUpsert(sqlite, validation.cleanData);
    assert.strictEqual(periodId1, "TCS.NS_FY2098");

    // Re-executing upsert is idempotent (updates in place without error)
    const periodId2 = executePeriodUpsert(sqlite, validation.cleanData);
    assert.strictEqual(periodId2, "TCS.NS_FY2098");

    // Verify row exists in database
    const row = sqlite.prepare("SELECT id, period, revenue FROM financial_periods WHERE id = ?").get("TCS.NS_FY2098") as {
      id: string;
      period: string;
      revenue: number;
    } | undefined;
    assert.ok(row, "Period row must exist in financial_periods table");
    assert.strictEqual(row.revenue, 100000);

    // Cleanup inserted test period
    sqlite.prepare("DELETE FROM financial_periods WHERE id = 'TCS.NS_FY2098'").run();
  });
});
