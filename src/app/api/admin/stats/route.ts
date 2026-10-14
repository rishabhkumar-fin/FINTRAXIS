import { NextResponse } from "next/server";
import { sqlite } from "@/db/index";
import { primaryDataProvider } from "@/lib/providers";

export async function GET() {
  try {
    // 1. Database table counts
    const counts = {
      companies: (sqlite.prepare("SELECT count(*) as count FROM companies").get() as { count: number })?.count ?? 0,
      financialPeriods: (sqlite.prepare("SELECT count(*) as count FROM financial_periods").get() as { count: number })?.count ?? 0,
      auditLineItems: (sqlite.prepare("SELECT count(*) as count FROM audit_line_items").get() as { count: number })?.count ?? 0,
      users: (sqlite.prepare("SELECT count(*) as count FROM users").get() as { count: number })?.count ?? 0,
      auditLogs: (sqlite.prepare("SELECT count(*) as count FROM admin_audit_logs").get() as { count: number })?.count ?? 0,
    };

    // 2. Pragmas and DB health
    let journalMode = "UNKNOWN";
    let synchronous = "UNKNOWN";
    try {
      journalMode = (sqlite.pragma("journal_mode") as Array<{ journal_mode: string }>)?.[0]?.journal_mode ?? "WAL";
      synchronous = String((sqlite.pragma("synchronous") as Array<{ synchronous: number }>)?.[0]?.synchronous ?? "1");
    } catch {
      // pragma query fallback
    }

    // 3. System Config Hurdles
    const configRows = sqlite.prepare("SELECT key, value, description, updated_at as updatedAt, updated_by as updatedBy FROM system_config").all() as Array<{
      key: string;
      value: string;
      description: string;
      updatedAt: string;
      updatedBy: string;
    }>;

    const configMap: Record<string, string> = {};
    for (const row of configRows) {
      configMap[row.key] = row.value;
    }

    // 4. Memory and runtime
    const memory = process.memoryUsage();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      counts,
      database: {
        engine: "better-sqlite3 / Drizzle ORM",
        journalMode,
        synchronous,
        isVercel: Boolean(process.env.VERCEL),
        region: process.env.VERCEL_REGION || "local-edge",
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        uptimeSeconds: Math.floor(process.uptime()),
        heapUsedMB: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
        heapTotalMB: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
        rssMB: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
      },
      provider: {
        name: primaryDataProvider.metadata.name,
        tier: primaryDataProvider.metadata.tier,
        isContractual: primaryDataProvider.metadata.isContractual,
        coverageScope: "US (SEC EDGAR/Yahoo) · IND (NSE/BSE) · JPN (TSE)",
      },
      config: configRows,
      activeHurdles: {
        globalLeverage: Number(configMap.GLOBAL_LEVERAGE_HURDLE ?? "3.5"),
        globalCoverage: Number(configMap.GLOBAL_COVERAGE_HURDLE ?? "2.5"),
        globalLiquidity: Number(configMap.GLOBAL_LIQUIDITY_HURDLE ?? "1.1"),
        maintenanceMode: configMap.MAINTENANCE_MODE === "true",
        rateLimitRpm: Number(configMap.RATE_LIMIT_ANALYST_RPM ?? "60"),
      },
    });
  } catch (err: unknown) {
    console.error("GET /api/admin/stats error:", err);
    const msg = err instanceof Error ? err.message : "Failed to load system telemetry";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
