import { db } from "./index";
import { companies, financialPeriods, auditLineItems } from "./schema";
import { SEED_COMPANIES, SEED_PERIODS, SEED_AUDIT_ITEMS } from "../lib/seedData";
import { sql } from "drizzle-orm";

export function runSeed() {
  console.log(">> Seeding FINTRAXIS Institutional SQLite Database...");
  try {
    const existing = db
      .select({ count: sql<number>`count(*)` })
      .from(companies)
      .get();

    if (existing && existing.count > 0) {
      console.log(`>> SQLite already populated (${existing.count} companies). Skipping redundant seed.`);
      return;
    }

    // Insert Companies
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
    console.log(`>> Successfully seeded ${SEED_COMPANIES.length} global institutional companies.`);

    // Insert Financial Periods
    for (const p of SEED_PERIODS) {
      db.insert(financialPeriods)
        .values({
          ...p,
          periodType: p.periodType ?? "ANNUAL",
        })
        .run();
    }
    console.log(`>> Successfully seeded ${SEED_PERIODS.length} multi-period financial ledgers.`);

    // Insert Audit Line Items
    for (const a of SEED_AUDIT_ITEMS) {
      db.insert(auditLineItems)
        .values({
          ...a,
          formula: a.formula ?? null,
          calculationTreeJson: a.calculationTreeJson ?? null,
          notes: a.notes ?? null,
        })
        .run();
    }
    console.log(`>> Successfully seeded ${SEED_AUDIT_ITEMS.length} audit provenance records.`);
    console.log(">> Seeding complete.");
  } catch (err) {
    console.error("Seed error:", err);
  }
}

if (process.argv[1] && process.argv[1].includes("seed.ts")) {
  runSeed();
}
