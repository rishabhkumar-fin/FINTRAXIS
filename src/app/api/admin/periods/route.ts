import { NextResponse } from "next/server";
import { sqlite } from "@/db/index";
import { logAuditEvent } from "@/lib/auditLogger";
import { verifyOperatorClearance } from "@/lib/authGuard";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json({ success: false, error: "companyId parameter is required" }, { status: 400 });
    }

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

    const body = await request.json();
    const {
      companyId,
      period,
      revenue,
      ebitda,
      totalDebt,
      cashAndEquivalents,
      interestExpense,
      ebit,
      netIncome,
      totalAssets,
      totalLiabilities,
      totalCurrentAssets,
      totalCurrentLiabilities,
      filingForm = "10-K / Annual Report",
      filingDate = new Date().toISOString().split("T")[0],
    } = body;

    if (!companyId || !period) {
      return NextResponse.json({ success: false, error: "companyId and period are required" }, { status: 400 });
    }

    const cleanCompanyId = companyId.toUpperCase().trim();
    const cleanPeriod = period.toUpperCase().trim();
    const periodId = `${cleanCompanyId}_${cleanPeriod}`;

    // Verify company exists
    const company = sqlite.prepare("SELECT id, currency, scale_unit as scaleUnit FROM companies WHERE id = ?").get(cleanCompanyId) as {
      id: string;
      currency: string;
      scaleUnit: string;
    } | undefined;

    if (!company) {
      return NextResponse.json({ success: false, error: "Company entity not found in security master" }, { status: 404 });
    }

    const currency = body.currency || company.currency;
    const scaleUnit = body.scaleUnit || company.scaleUnit;
    const computedEbit = ebit !== undefined ? Number(ebit) : (ebitda !== undefined ? Number(ebitda) * 0.85 : 0);
    const computedEbitda = ebitda !== undefined ? Number(ebitda) : computedEbit * 1.15;

    sqlite.prepare(`
      INSERT INTO financial_periods (
        id, company_id, period, period_type, filing_date, filing_form, filing_url,
        currency, scale_unit, revenue, ebit, ebitda, interest_expense, net_income,
        cash_and_equivalents, total_current_assets, total_assets,
        total_current_liabilities, total_debt, total_liabilities, total_shareholders_equity
      ) VALUES (
        ?, ?, ?, 'ANNUAL', ?, ?, 'https://www.sec.gov/edgar',
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?
      )
      ON CONFLICT(id) DO UPDATE SET
        revenue = excluded.revenue,
        ebit = excluded.ebit,
        ebitda = excluded.ebitda,
        interest_expense = excluded.interest_expense,
        net_income = excluded.net_income,
        cash_and_equivalents = excluded.cash_and_equivalents,
        total_current_assets = excluded.total_current_assets,
        total_assets = excluded.total_assets,
        total_current_liabilities = excluded.total_current_liabilities,
        total_debt = excluded.total_debt,
        total_liabilities = excluded.total_liabilities,
        total_shareholders_equity = excluded.total_shareholders_equity,
        filing_date = excluded.filing_date,
        filing_form = excluded.filing_form
    `).run(
      periodId,
      cleanCompanyId,
      cleanPeriod,
      filingDate,
      filingForm,
      currency,
      scaleUnit,
      revenue !== undefined ? Number(revenue) : null,
      computedEbit,
      computedEbitda,
      interestExpense !== undefined ? Number(interestExpense) : null,
      netIncome !== undefined ? Number(netIncome) : null,
      cashAndEquivalents !== undefined ? Number(cashAndEquivalents) : null,
      totalCurrentAssets !== undefined ? Number(totalCurrentAssets) : null,
      totalAssets !== undefined ? Number(totalAssets) : null,
      totalCurrentLiabilities !== undefined ? Number(totalCurrentLiabilities) : null,
      totalDebt !== undefined ? Number(totalDebt) : null,
      totalLiabilities !== undefined ? Number(totalLiabilities) : null,
      (totalAssets !== undefined && totalLiabilities !== undefined) ? (Number(totalAssets) - Number(totalLiabilities)) : null
    );

    logAuditEvent(
      "STATEMENT_EDITOR",
      clearance.operator,
      `Updated financial ledger statements for ${cleanCompanyId} (${cleanPeriod}): Rev ${revenue}, EBITDA ${computedEbitda}, Debt ${totalDebt}, Cash ${cashAndEquivalents}`,
      "INFO"
    );

    return NextResponse.json({
      success: true,
      message: `Financial statements for ${cleanCompanyId} ${cleanPeriod} successfully saved.`,
      periodId,
    });
  } catch (err: unknown) {
    console.error("POST /api/admin/periods error:", err);
    const msg = err instanceof Error ? err.message : "Failed to update financial statements";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
