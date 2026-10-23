import { NextResponse } from "next/server";
import { sqlite } from "@/db/index";
import { logAuditEvent } from "@/lib/auditLogger";
import { verifyOperatorClearance } from "@/lib/authGuard";
import { validatePeriodRecord, executePeriodUpsert, PeriodImportPayload } from "@/lib/periodImport";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (companyId) {
      const rows = sqlite.prepare(`
        SELECT 
          id, company_id as companyId, period, period_type as periodType, filing_date as filingDate,
          filing_form as filingForm, filing_url as filingUrl, currency, scale_unit as scaleUnit,
          revenue, ebit, ebitda, interest_expense as interestExpense, net_income as netIncome,
          cash_and_equivalents as cashAndEquivalents, marketable_securities as marketableSecurities,
          total_current_assets as totalCurrentAssets, total_assets as totalAssets,
          total_current_liabilities as totalCurrentLiabilities, total_debt as totalDebt,
          total_liabilities as totalLiabilities, total_shareholders_equity as totalShareholdersEquity,
          operating_cash_flow as operatingCashFlow, free_cash_flow as freeCashFlow
        FROM financial_periods
        WHERE company_id = ?
        ORDER BY period DESC
      `).all(companyId.toUpperCase().trim());

      return NextResponse.json({
        success: true,
        periods: rows,
      });
    }

    // Return all financial periods for coverage matrix
    const allRows = sqlite.prepare(`
      SELECT 
        id, company_id as companyId, period, period_type as periodType, filing_date as filingDate,
        filing_form as filingForm, filing_url as filingUrl, currency, scale_unit as scaleUnit,
        revenue, ebit, ebitda, interest_expense as interestExpense, net_income as netIncome,
        cash_and_equivalents as cashAndEquivalents, marketable_securities as marketableSecurities,
        total_current_assets as totalCurrentAssets, total_assets as totalAssets,
        total_current_liabilities as totalCurrentLiabilities, total_debt as totalDebt,
        total_liabilities as totalLiabilities, total_shareholders_equity as totalShareholdersEquity,
        operating_cash_flow as operatingCashFlow, free_cash_flow as freeCashFlow
      FROM financial_periods
      ORDER BY company_id ASC, period DESC
    `).all();

    return NextResponse.json({
      success: true,
      periods: allRows,
    });
  } catch (err: unknown) {
    console.error("GET /api/admin/periods error:", err);
    const msg = err instanceof Error ? err.message : "Failed to load financial periods";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const clearance = verifyOperatorClearance(request, ["SUPER_ADMIN", "ADMIN", "LEAD_ANALYST"]);
    if (!clearance.allowed) {
      return NextResponse.json({ success: false, error: clearance.error }, { status: 403 });
    }

    const rawBody = await request.json();
    const records: PeriodImportPayload[] = Array.isArray(rawBody) ? rawBody : [rawBody];

    if (records.length === 0) {
      return NextResponse.json({ success: false, error: "No records found in payload" }, { status: 400 });
    }

    const importedIds: string[] = [];
    const allWarnings: string[] = [];

    const upsertTx = sqlite.transaction((items: PeriodImportPayload[]) => {
      for (const item of items) {
        const ticker = (item.ticker || (item as unknown as { companyId?: string }).companyId || "").toUpperCase().trim();
        const company = sqlite.prepare("SELECT id, currency, scale_unit as scaleUnit FROM companies WHERE id = ?").get(ticker) as {
          id: string;
          currency: string;
          scaleUnit: string;
        } | undefined;

        if (!company) {
          throw new Error(`Company ${ticker} not registered in database. Please enroll the company first.`);
        }

        const validation = validatePeriodRecord(item, company);
        if (!validation.isValid || !validation.cleanData) {
          throw new Error(validation.error || "Period validation failed");
        }

        if (validation.warnings.length > 0) {
          allWarnings.push(...validation.warnings);
        }

        const periodId = executePeriodUpsert(sqlite, validation.cleanData);
        importedIds.push(periodId);

        logAuditEvent(
          "PERIOD_IMPORT",
          clearance.operator || "Administrator",
          `Imported reporting period ${validation.cleanData.fiscalYear} for ${ticker}. Status: ${validation.cleanData.status}`,
          "INFO"
        );
      }
    });

    upsertTx(records);

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${importedIds.length} reporting ${importedIds.length === 1 ? "period" : "periods"}. Ratios, scores, and stress baseline recomputed.`,
      importedIds,
      warnings: allWarnings.length > 0 ? allWarnings : undefined,
    });
  } catch (err: unknown) {
    console.error("POST /api/admin/periods error:", err);
    const msg = err instanceof Error ? err.message : "Failed to import reporting period";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
