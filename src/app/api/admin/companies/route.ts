import { NextResponse } from "next/server";
import { sqlite } from "@/db/index";
import { logAuditEvent } from "@/lib/auditLogger";

interface CompanyAdminRow {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  country: string;
  currency: string;
  scaleUnit: string;
  sector: string;
  industry: string;
  marketCap: number | null;
  sharePrice: number | null;
  createdAt: string;
  updatedAt: string;
  periodCount: number;
  auditItemCount: number;
  latestPeriod: string | null;
}

export async function GET() {
  try {
    const rows = sqlite.prepare(`
      SELECT 
        c.id, c.symbol, c.name, c.exchange, c.country, c.currency, c.scale_unit as scaleUnit,
        c.sector, c.industry, c.market_cap as marketCap, c.share_price as sharePrice,
        c.created_at as createdAt, c.updated_at as updatedAt,
        (SELECT COUNT(*) FROM financial_periods fp WHERE fp.company_id = c.id) as periodCount,
        (SELECT COUNT(*) FROM audit_line_items ali WHERE ali.company_id = c.id) as auditItemCount,
        (SELECT period FROM financial_periods fp WHERE fp.company_id = c.id ORDER BY period DESC LIMIT 1) as latestPeriod
      FROM companies c
      ORDER BY c.symbol ASC
    `).all() as CompanyAdminRow[];

    return NextResponse.json({
      success: true,
      count: rows.length,
      companies: rows,
    });
  } catch (err: unknown) {
    console.error("GET /api/admin/companies error:", err);
    const msg = err instanceof Error ? err.message : "Failed to load security master registry";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const operator = searchParams.get("operator") || "SUPER_ADMIN";

    if (!id) {
      return NextResponse.json({ success: false, error: "Company ID is required" }, { status: 400 });
    }

    const cleanId = id.toUpperCase().trim();

    // Check existence
    const existing = sqlite.prepare("SELECT id, name FROM companies WHERE id = ?").get(cleanId) as { id: string; name: string } | undefined;
    if (!existing) {
      return NextResponse.json({ success: false, error: "Company not found in security master" }, { status: 404 });
    }

    // Cascade delete audit line items, financial periods, and company
    sqlite.prepare("DELETE FROM audit_line_items WHERE company_id = ?").run(cleanId);
    sqlite.prepare("DELETE FROM financial_periods WHERE company_id = ?").run(cleanId);
    sqlite.prepare("DELETE FROM companies WHERE id = ?").run(cleanId);

    logAuditEvent(
      "COMPANY_INGEST",
      operator,
      `Purged entity ${cleanId} (${existing.name}) and all associated financial periods from SQLite`,
      "WARNING"
    );

    return NextResponse.json({
      success: true,
      message: `Entity ${cleanId} and linked financial ledgers successfully purged from database.`,
    });
  } catch (err: unknown) {
    console.error("DELETE /api/admin/companies error:", err);
    const msg = err instanceof Error ? err.message : "Failed to purge security master record";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
