import { NextResponse } from "next/server";
import { sqlite } from "@/db/index";
import { logAuditEvent } from "@/lib/auditLogger";
import { verifyOperatorClearance } from "@/lib/authGuard";

export async function GET() {
  try {
    const rows = sqlite.prepare(`
      SELECT key, value, description, updated_at as updatedAt, updated_by as updatedBy
      FROM system_config
      ORDER BY key ASC
    `).all();

    const history = sqlite.prepare(`
      SELECT id, timestamp, event_type as eventType, severity, operator, details
      FROM admin_audit_logs
      WHERE event_type = 'POLICY_UPDATE'
      ORDER BY timestamp DESC
      LIMIT 50
    `).all();

    return NextResponse.json({
      success: true,
      config: rows,
      history,
    });
  } catch (err: unknown) {
    console.error("GET /api/admin/config error:", err);
    const msg = err instanceof Error ? err.message : "Failed to load system config";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const clearance = verifyOperatorClearance(request, ["SUPER_ADMIN", "ADMIN", "LEAD_ANALYST"]);
    if (!clearance.allowed) {
      return NextResponse.json({ success: false, error: clearance.error }, { status: 403 });
    }

    const body = await request.json();
    const operator = clearance.operator;
    const now = new Date().toISOString();

    const upsertConfig = sqlite.prepare(`
      INSERT INTO system_config (key, value, description, updated_at, updated_by)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        description = COALESCE(excluded.description, system_config.description),
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by
    `);

    // Case 0: Reset to Institutional Default Hurdles
    if (body.resetToDefault) {
      const defaults: Record<string, { val: string; desc: string }> = {
        GLOBAL_LEVERAGE_HURDLE: { val: "3.50", desc: "Global Net Debt / EBITDA threshold trigger for amber/red flags" },
        GLOBAL_COVERAGE_HURDLE: { val: "2.50", desc: "Global EBIT / Interest Expense coverage floor" },
        GLOBAL_LIQUIDITY_HURDLE: { val: "1.30", desc: "Global Current Ratio liquidity floor" },
        ALERT_MARGIN_DETERIORATION_PCT: { val: "-5.0", desc: "Operating margin period-over-period percentage drop alert threshold" },
        ALERT_REVENUE_CONTRACTION_PCT: { val: "-10.0", desc: "Year-over-year revenue contraction trigger for distress surveillance" },
        MAX_RATE_SHOCK_BPS: { val: "400", desc: "Maximum permissible interest rate shock in stress simulations (bps)" },
      };
      for (const [k, d] of Object.entries(defaults)) {
        upsertConfig.run(k, d.val, d.desc, now, operator);
      }
      logAuditEvent(
        "POLICY_UPDATE",
        operator,
        "Risk hurdle reference thresholds reset to institutional defaults (Leverage 3.50x, Coverage 2.50x, Liquidity 1.30x)",
        "WARNING"
      );
      return NextResponse.json({
        success: true,
        message: "Risk hurdles reset to institutional reference defaults",
      });
    }

    // Case 1: Batch Hurdles calibration
    if (body.hurdles && typeof body.hurdles === "object") {
      const h = body.hurdles;
      const applied: Record<string, string> = {};

      if (h.globalLeverage !== undefined) {
        const val = Math.max(0.1, Math.min(20.0, Number(h.globalLeverage)));
        upsertConfig.run("GLOBAL_LEVERAGE_HURDLE", String(val), "Global Net Debt / EBITDA threshold trigger for amber/red flags", now, operator);
        applied.GLOBAL_LEVERAGE_HURDLE = String(val);
      }
      if (h.globalCoverage !== undefined) {
        const val = Math.max(0.1, Math.min(50.0, Number(h.globalCoverage)));
        upsertConfig.run("GLOBAL_COVERAGE_HURDLE", String(val), "Global EBIT / Interest Expense coverage floor", now, operator);
        applied.GLOBAL_COVERAGE_HURDLE = String(val);
      }
      if (h.globalLiquidity !== undefined) {
        const val = Math.max(0.1, Math.min(10.0, Number(h.globalLiquidity)));
        upsertConfig.run("GLOBAL_LIQUIDITY_HURDLE", String(val), "Global Current Ratio liquidity floor", now, operator);
        applied.GLOBAL_LIQUIDITY_HURDLE = String(val);
      }
      if (h.rateLimitRpm !== undefined) {
        const val = Math.max(10, Math.min(1000, Number(h.rateLimitRpm)));
        upsertConfig.run("RATE_LIMIT_ANALYST_RPM", String(val), "Requests per minute allowed per terminal session", now, operator);
        applied.RATE_LIMIT_ANALYST_RPM = String(val);
      }
      if (h.alertMarginDeterioration !== undefined) {
        const val = Math.min(0, Math.max(-50, Number(h.alertMarginDeterioration)));
        upsertConfig.run("ALERT_MARGIN_DETERIORATION_PCT", String(val), "Operating margin period-over-period percentage drop alert threshold", now, operator);
        applied.ALERT_MARGIN_DETERIORATION_PCT = String(val);
      }
      if (h.alertRevenueContraction !== undefined) {
        const val = Math.min(0, Math.max(-50, Number(h.alertRevenueContraction)));
        upsertConfig.run("ALERT_REVENUE_CONTRACTION_PCT", String(val), "Year-over-year revenue contraction trigger for distress surveillance", now, operator);
        applied.ALERT_REVENUE_CONTRACTION_PCT = String(val);
      }
      if (h.maxRateShockBps !== undefined) {
        const val = Math.max(50, Math.min(2000, Number(h.maxRateShockBps)));
        upsertConfig.run("MAX_RATE_SHOCK_BPS", String(val), "Maximum permissible interest rate shock in stress simulations (bps)", now, operator);
        applied.MAX_RATE_SHOCK_BPS = String(val);
      }
      if (h.defaultCurrency !== undefined && typeof h.defaultCurrency === "string") {
        upsertConfig.run("DEFAULT_CURRENCY", h.defaultCurrency.trim().toUpperCase(), "Default institutional presentation currency", now, operator);
        applied.DEFAULT_CURRENCY = h.defaultCurrency.trim().toUpperCase();
      }
      if (h.defaultPeriodType !== undefined && typeof h.defaultPeriodType === "string") {
        upsertConfig.run("DEFAULT_PERIOD_TYPE", h.defaultPeriodType.trim().toUpperCase(), "Default filing cadence across financial statements", now, operator);
        applied.DEFAULT_PERIOD_TYPE = h.defaultPeriodType.trim().toUpperCase();
      }
      if (h.sessionTimeoutMinutes !== undefined) {
        const val = Math.max(5, Math.min(1440, Number(h.sessionTimeoutMinutes)));
        upsertConfig.run("SESSION_TIMEOUT_MINUTES", String(val), "Automatic inactivity logout timer", now, operator);
        applied.SESSION_TIMEOUT_MINUTES = String(val);
      }
      if (h.loginLockoutAttempts !== undefined) {
        const val = Math.max(1, Math.min(20, Number(h.loginLockoutAttempts)));
        upsertConfig.run("LOGIN_LOCKOUT_ATTEMPTS", String(val), "Brute-force security lockout threshold", now, operator);
        applied.LOGIN_LOCKOUT_ATTEMPTS = String(val);
      }
      if (h.organizationName !== undefined && typeof h.organizationName === "string") {
        upsertConfig.run("ORGANIZATION_NAME", h.organizationName.trim(), "Entity identifier for regulatory research exports", now, operator);
        applied.ORGANIZATION_NAME = h.organizationName.trim();
      }
      if (h.maintenanceMode !== undefined) {
        upsertConfig.run("MAINTENANCE_MODE", String(Boolean(h.maintenanceMode)), "Operational lockdown flag for schema re-indexing", now, operator);
        applied.MAINTENANCE_MODE = String(Boolean(h.maintenanceMode));
      }

      logAuditEvent(
        "POLICY_UPDATE",
        operator,
        `Batch risk policy hurdles calibrated: ${Object.keys(applied).join(", ")}`,
        "WARNING"
      );

      return NextResponse.json({
        success: true,
        message: "Institutional risk policy hurdles calibrated and committed to audit journal",
        applied,
      });
    }

    // Case 2: Single key-value update
    const { key, value, description } = body;
    if (!key || value === undefined) {
      return NextResponse.json({ success: false, error: "Key and Value are required" }, { status: 400 });
    }

    const cleanKey = String(key).toUpperCase().trim();
    const strValue = String(value).trim();

    const existing = sqlite.prepare("SELECT value FROM system_config WHERE key = ?").get(cleanKey) as { value: string } | undefined;
    upsertConfig.run(cleanKey, strValue, description || null, now, operator);

    logAuditEvent(
      "POLICY_UPDATE",
      operator,
      `Policy hurdle ${cleanKey} adjusted: "${existing?.value ?? 'UNSET'}" -> "${strValue}"`,
      "WARNING"
    );

    return NextResponse.json({
      success: true,
      message: `System parameter ${cleanKey} updated successfully`,
      entry: {
        key: cleanKey,
        value: strValue,
        description,
        updatedAt: now,
        updatedBy: operator,
      },
    });
  } catch (err: unknown) {
    console.error("POST /api/admin/config error:", err);
    const msg = err instanceof Error ? err.message : "Failed to calibrate system policy parameter";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
