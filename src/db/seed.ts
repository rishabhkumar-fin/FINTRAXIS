import { db, sqlite } from "./index.ts";
import { companies, financialPeriods, auditLineItems } from "./schema.ts";
import { SEED_COMPANIES, SEED_PERIODS, SEED_AUDIT_ITEMS } from "../lib/seedData.ts";
import { INSTITUTIONAL_COMPANIES } from "../lib/institutionalDatabase.ts";
import crypto from "crypto";

export function runSeed() {
  console.log(">> Seeding FINTRAXIS Institutional SQLite Database...");
  try {
    const now = new Date().toISOString();

    // 1. Ensure Base Companies from SEED_COMPANIES exist
    for (const comp of SEED_COMPANIES) {
      const existing = sqlite.prepare("SELECT id FROM companies WHERE id = ?").get(comp.id);
      if (!existing) {
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
    }

    // 2. Ensure Curated Core Companies (TCS.NS, MSFT) from INSTITUTIONAL_COMPANIES exist
    const coreAdditions = ["TCS.NS", "MSFT"];
    for (const ticker of coreAdditions) {
      const data = INSTITUTIONAL_COMPANIES[ticker];
      if (data) {
        const existing = sqlite.prepare("SELECT id FROM companies WHERE id = ?").get(data.company.id);
        if (!existing) {
          db.insert(companies)
            .values({
              ...data.company,
              marketCap: data.company.marketCap ?? null,
              sharePrice: data.company.sharePrice ?? null,
              isin: data.company.isin ?? null,
              cik: data.company.cik ?? null,
            })
            .run();
          console.log(`>> Enrolled ${data.company.name} (${data.company.symbol}) into security master.`);
        }

        // Insert periods
        for (const p of data.periods) {
          const existingP = sqlite.prepare("SELECT id FROM financial_periods WHERE id = ?").get(p.id);
          if (!existingP) {
            db.insert(financialPeriods)
              .values({
                ...p,
                periodType: p.periodType ?? "ANNUAL",
              })
              .run();
          }
        }
      }
    }

    // 3. Insert Financial Periods from SEED_PERIODS
    for (const p of SEED_PERIODS) {
      const existingP = sqlite.prepare("SELECT id FROM financial_periods WHERE id = ?").get(p.id);
      if (!existingP) {
        db.insert(financialPeriods)
          .values({
            ...p,
            periodType: p.periodType ?? "ANNUAL",
          })
          .run();
      }
    }

    // 4. Insert Audit Line Items
    for (const a of SEED_AUDIT_ITEMS) {
      const existingA = sqlite.prepare("SELECT id FROM audit_line_items WHERE id = ?").get(a.id);
      if (!existingA) {
        db.insert(auditLineItems)
          .values({
            ...a,
            formula: a.formula ?? null,
            calculationTreeJson: a.calculationTreeJson ?? null,
            notes: a.notes ?? null,
          })
          .run();
      }
    }

    // 5. Ensure Default Localhost Accounts exist
    const defaultAccounts = [
      {
        id: "usr_analyst_local",
        name: "Sarah Jenkins",
        email: "analyst@fintraxis.local",
        passwordPlain: "analyst123",
        role: "ANALYST",
        desk: "Credit Risk & Underwriting",
        avatar: "crest",
        netDebtEbitdaHurdle: 3.50,
        interestCoverageHurdle: 2.50,
        currentRatioHurdle: 1.10,
      },
      {
        id: "usr_admin_local",
        name: "Institutional Administrator",
        email: "admin@fintraxis.local",
        passwordPlain: "admin123",
        role: "SUPER_ADMIN",
        desk: "Global Systems & Risk Governance",
        avatar: "security",
        netDebtEbitdaHurdle: 3.50,
        interestCoverageHurdle: 2.50,
        currentRatioHurdle: 1.10,
      },
    ];

    for (const acc of defaultAccounts) {
      const existingUser = sqlite.prepare("SELECT id FROM users WHERE lower(email) = ?").get(acc.email.toLowerCase());
      if (!existingUser) {
        const salt = crypto.randomBytes(16).toString("hex");
        const passwordHash = crypto
          .pbkdf2Sync(acc.passwordPlain, salt, 10000, 64, "sha512")
          .toString("hex");

        sqlite.prepare(`
          INSERT INTO users (id, name, email, password_hash, salt, desk, avatar, role, status, net_debt_ebitda_hurdle, interest_coverage_hurdle, current_ratio_hurdle, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?)
        `).run(
          acc.id,
          acc.name,
          acc.email.toLowerCase(),
          passwordHash,
          salt,
          acc.desk,
          acc.avatar,
          acc.role,
          acc.netDebtEbitdaHurdle,
          acc.interestCoverageHurdle,
          acc.currentRatioHurdle,
          now
        );
        console.log(`>> Provisioned local operator account: ${acc.email} [${acc.role}]`);
      }
    }

    // 6. Ensure Global Policy Hurdles in system_config
    const upsertConfig = sqlite.prepare(`
      INSERT INTO system_config (key, value, description, updated_at, updated_by)
      VALUES (?, ?, ?, ?, 'SYSTEM')
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `);

    upsertConfig.run("GLOBAL_LEVERAGE_HURDLE", "3.5", "Global Net Debt / EBITDA threshold trigger for amber/red flags", now);
    upsertConfig.run("GLOBAL_COVERAGE_HURDLE", "2.5", "Global EBIT / Interest Expense coverage floor", now);
    upsertConfig.run("GLOBAL_LIQUIDITY_HURDLE", "1.1", "Global Current Ratio liquidity floor", now);

    // 7. Record Audit Journal Entry
    sqlite.prepare(`
      INSERT INTO admin_audit_logs (id, timestamp, event_type, severity, operator, details)
      VALUES (?, ?, 'SYSTEM_INIT', 'INFO', 'SYSTEM', 'FINTRAXIS SQLite database seeded with global securities and operator clearance')
    `).run(`log_${Date.now()}_seed`, now);

    console.log(">> Seeding complete. All securities, ledgers, and operator accounts are ready.");
  } catch (err) {
    console.error("Seed error:", err);
  }
}

if (process.argv[1] && process.argv[1].includes("seed.ts")) {
  runSeed();
}
