import { db } from "../db/index";
import { companies, financialPeriods, auditLineItems } from "../db/schema";
import { eq, or, sql } from "drizzle-orm";
import {
  CompanyEntity,
  FinancialPeriodData,
  AuditRecord,
  CompanyRiskProfile,
  StressSimulationInputs,
} from "./types";
import { SEED_COMPANIES, SEED_PERIODS, SEED_AUDIT_ITEMS } from "./seedData";
import { INSTITUTIONAL_COMPANIES } from "./institutionalDatabase";
import { calculateRatios, evaluateEarlyWarnings, runStressSimulation } from "./financialEngine";
import { autoIngestCompany } from "./autoIngest";

/**
 * Ensures the SQLite database is initialized and populated with seed entities.
 */
export async function ensureDatabaseSeeded(): Promise<void> {
  try {
    const existingCount = db
      .select({ count: sql<number>`count(*)` })
      .from(companies)
      .get();

    if (!existingCount || existingCount.count === 0) {
      // Seed base companies
      for (const comp of SEED_COMPANIES) {
        db.insert(companies)
          .values({
            ...comp,
            marketCap: comp.marketCap ?? null,
            sharePrice: comp.sharePrice ?? null,
            isin: comp.isin ?? null,
            cik: comp.cik ?? null,
          })
          .run();
      }

      // Seed financial periods
      for (const period of SEED_PERIODS) {
        db.insert(financialPeriods)
          .values({
            ...period,
            periodType: period.periodType ?? "ANNUAL",
          })
          .run();
      }

      // Seed audit records
      for (const item of SEED_AUDIT_ITEMS) {
        db.insert(auditLineItems)
          .values({
            ...item,
            formula: item.formula ?? null,
            calculationTreeJson: item.calculationTreeJson ?? null,
            notes: item.notes ?? null,
          })
          .run();
      }

      // Seed institutional companies & their periods
      for (const item of Object.values(INSTITUTIONAL_COMPANIES)) {
        try {
          db.insert(companies).values(item.company).run();
          for (const p of item.periods) {
            db.insert(financialPeriods).values(p).run();
          }
        } catch {
          // company may already exist
        }
      }
    }
  } catch (error) {
    console.error("Error checking or seeding SQLite database:", error);
  }
}

/**
 * Resolves a global security query across ticker symbols, names, CIKs, ISINs, and exchanges.
 */
export async function resolveSecurity(query: string): Promise<CompanyEntity | null> {
  await ensureDatabaseSeeded();
  const clean = query.trim().toUpperCase();
  if (!clean) return null;

  // Check institutional registry first
  if (INSTITUTIONAL_COMPANIES[clean]) {
    return INSTITUTIONAL_COMPANIES[clean].company;
  }
  const institutionalMatch = Object.values(INSTITUTIONAL_COMPANIES).find(
    (c) =>
      c.company.symbol.toUpperCase() === clean ||
      c.company.id.toUpperCase() === clean ||
      c.company.name.toUpperCase().includes(clean)
  );
  if (institutionalMatch) {
    return institutionalMatch.company;
  }

  // Exact ID match or symbol match in DB
  const match = db
    .select()
    .from(companies)
    .where(
      or(
        eq(companies.id, clean),
        eq(companies.symbol, clean),
        eq(companies.cik, clean.padStart(10, "0")),
        eq(companies.isin, clean),
        sql`upper(${companies.name}) like ${`%${clean}%`}`,
        sql`upper(${companies.symbol}) like ${`%${clean}%`}`
      )
    )
    .get();

  if (match) {
    return match as unknown as CompanyEntity;
  }

  // Fallback to static seed memory if db is being restored
  const staticFound = SEED_COMPANIES.find(
    (c) =>
      c.id.toUpperCase() === clean ||
      c.symbol.toUpperCase() === clean ||
      c.isin?.toUpperCase() === clean ||
      c.cik === clean.padStart(10, "0") ||
      c.name.toUpperCase().includes(clean)
  );

  return staticFound || null;
}

export async function getAllCompanies(): Promise<CompanyEntity[]> {
  await ensureDatabaseSeeded();
  const companyMap = new Map<string, CompanyEntity>();

  // Add seed companies
  SEED_COMPANIES.forEach((c) => companyMap.set(c.id, c));

  // Add institutional companies
  Object.values(INSTITUTIONAL_COMPANIES).forEach((c) => companyMap.set(c.company.id, c.company));

  // Add DB companies
  try {
    const list = db.select().from(companies).all();
    list.forEach((c) => companyMap.set(c.id, c as unknown as CompanyEntity));
  } catch (e) {
    console.error("Error getting companies from DB:", e);
  }

  return Array.from(companyMap.values());
}

/**
 * Retrieves the full financial risk profile, periods, ratios, EWS flags, and stress simulation.
 */
export async function getCompanyDetails(
  id: string,
  simInputs: StressSimulationInputs = { revenueShockPct: -10, cogsInflationPct: 5, rateShockBps: 200 }
): Promise<CompanyRiskProfile | null> {
  await ensureDatabaseSeeded();

  let company: CompanyEntity | null = null;
  let periods: FinancialPeriodData[] = [];

  // 1. Direct institutional match (100% verified authentic audited data)
  if (INSTITUTIONAL_COMPANIES[id]) {
    company = INSTITUTIONAL_COMPANIES[id].company;
    periods = INSTITUTIONAL_COMPANIES[id].periods;
  }

  // 2. Database lookup if not in curated institutional registry
  if (!company) {
    try {
      const res = db.select().from(companies).where(eq(companies.id, id)).get();
      if (res) company = res as unknown as CompanyEntity;
    } catch (e) {
      console.error("DB company lookup error:", e);
    }
  }

  if (!company) {
    company = SEED_COMPANIES.find((c) => c.id === id) || null;
  }

  // 3. Automatic on-the-fly ingestion for any company worldwide
  if (!company) {
    company = await autoIngestCompany(id);
  }
  if (!company) return null;

  // Retrieve periods if not already provided by institutional database
  if (periods.length === 0) {
    try {
      const pList = db
        .select()
        .from(financialPeriods)
        .where(eq(financialPeriods.companyId, id))
        .orderBy(sql`${financialPeriods.period} desc`)
        .all();
      if (pList.length > 0) {
        periods = pList as unknown as FinancialPeriodData[];
      }
    } catch (e) {
      console.error("DB periods lookup error:", e);
    }
  }

  if (periods.length === 0) {
    periods = SEED_PERIODS.filter((p) => p.companyId === id);
  }

  if (periods.length === 0) {
    await autoIngestCompany(id);
    try {
      const pList = db
        .select()
        .from(financialPeriods)
        .where(eq(financialPeriods.companyId, id))
        .orderBy(sql`${financialPeriods.period} desc`)
        .all();
      if (pList.length > 0) {
        periods = pList as unknown as FinancialPeriodData[];
      }
    } catch (e) {
      console.error("DB re-fetch periods error:", e);
    }
  }

  const isFinancial = company.sector === "Financial Services" || company.sector === "Banking";
  const latestPeriod = periods[0] ?? null;
  const latestRatios = latestPeriod
    ? calculateRatios(latestPeriod, periods[1] ?? null, isFinancial, company)
    : {
        currentRatio: null,
        quickRatio: null,
        cashRatio: null,
        debtToEquity: null,
        netDebtToEbitda: null,
        interestCoverage: null,
        cfoToNetIncome: null,
        grossMarginPct: null,
        operatingMarginPct: null,
        netMarginPct: null,
        roePct: null,
        roaPct: null,
        tolToTnw: null,
        debtServiceProxy: null,
        altmanZDoublePrime: null,
        altmanZZone: null,
        beneishMScore: null,
        beneishMZone: null,
        promoterPledgeRatio: null,
        indicativeDrawingPower: null,
        contingentLiabilitiesRatio: null,
      };

  const { flags, score, tier } = evaluateEarlyWarnings(periods, latestRatios);

  const simulation = latestPeriod
    ? runStressSimulation(latestPeriod, simInputs)
    : {
        basePeriod: "N/D",
        simulatedRevenue: 0,
        revenueDeltaPct: 0,
        simulatedCogs: 0,
        simulatedGrossProfit: 0,
        simulatedGrossMarginPct: 0,
        simulatedEbit: 0,
        simulatedInterestExpense: 0,
        incrementalInterestExpense: 0,
        floatingRateDebtSharePct: 40,
        stressedFloatingDebtAmount: 0,
        simulatedEbitda: 0,
        simulatedNetIncome: 0,
        simulatedInterestCoverage: null,
        simulatedNetDebtToEbitda: null,
        projectedMonthlyBurn: 0,
        cashBurnRunwayMonths: null,
        runwayStatus: "SUFFICIENT" as const,
      };

  return {
    company,
    periods,
    latestRatios,
    riskTier: tier,
    riskScore: score,
    earlyWarningFlags: flags,
    simulation,
  };
}

/**
 * Retrieves audit provenance metadata for an individual metric cell.
 */
export async function getAuditItem(
  companyId: string,
  metricKey: string,
  period?: string
): Promise<AuditRecord | null> {
  await ensureDatabaseSeeded();
  try {
    const query = db
      .select()
      .from(auditLineItems)
      .where(
        period
          ? sql`${auditLineItems.companyId} = ${companyId} and ${auditLineItems.metricKey} = ${metricKey} and ${auditLineItems.period} = ${period}`
          : sql`${auditLineItems.companyId} = ${companyId} and ${auditLineItems.metricKey} = ${metricKey}`
      )
      .get();
    if (query) return query as unknown as AuditRecord;
  } catch (e) {
    console.error("DB audit lookup error:", e);
  }

  const found = SEED_AUDIT_ITEMS.find(
    (a) =>
      a.companyId === companyId &&
      a.metricKey === metricKey &&
      (!period || a.period === period)
  );
  return found || null;
}

export { formatFinancialValue, formatRatio, formatPct } from "./formatters";
