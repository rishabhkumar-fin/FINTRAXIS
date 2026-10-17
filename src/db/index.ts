import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.ts";
import path from "path";
import fs from "fs";

let dbPath: string;

// In Vercel serverless environment, filesystem outside /tmp is read-only
if (process.env.VERCEL) {
  const tmpDir = "/tmp";
  const tmpDbPath = path.join(tmpDir, "fintraxis.db");
  const sourceDbPath = path.join(process.cwd(), "data", "fintraxis.db");
  if (!fs.existsSync(tmpDbPath) && fs.existsSync(sourceDbPath)) {
    try {
      fs.copyFileSync(sourceDbPath, tmpDbPath);
    } catch (e) {
      console.warn("Failed to copy seed db to /tmp:", e);
    }
  }
  dbPath = fs.existsSync(tmpDbPath) ? tmpDbPath : sourceDbPath;
} else {
  const dbDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  dbPath = path.join(dbDir, "fintraxis.db");
}

// Singleton connection for Next.js hot reload safety
const globalForDb = globalThis as unknown as {
  sqlite: Database.Database | undefined;
};

const sqlite =
  globalForDb.sqlite ??
  new Database(dbPath, {
    verbose: process.env.NODE_ENV === "development" ? undefined : undefined,
  });

try {
  // Enable WAL mode for high concurrency read/writes
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("synchronous = NORMAL");
} catch (e) {
  console.warn("SQLite pragma error (non-fatal):", e);
}

// Ensure tables and migrations exist
try {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      desk TEXT NOT NULL,
      avatar TEXT NOT NULL DEFAULT 'crest',
      net_debt_ebitda_hurdle REAL DEFAULT 3.50,
      interest_coverage_hurdle REAL DEFAULT 2.50,
      current_ratio_hurdle REAL DEFAULT 1.10,
      role TEXT NOT NULL DEFAULT 'ANALYST',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      event_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      operator TEXT NOT NULL,
      details TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS system_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      updated_at TEXT NOT NULL,
      updated_by TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS system_jobs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'IDLE',
      last_run_at TEXT,
      last_duration_ms REAL,
      records_processed REAL DEFAULT 0,
      last_error TEXT,
      created_at TEXT NOT NULL
    );
  `);

  try {
    sqlite.exec(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'ANALYST';`);
  } catch {
    // Column already exists
  }

  try {
    sqlite.exec(`ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'ACTIVE';`);
  } catch {
    // Column already exists
  }

  try {
    sqlite.exec(`ALTER TABLE users ADD COLUMN last_login_at TEXT;`);
  } catch {
    // Column already exists
  }

  // Seed default system_config if missing or insert new enterprise parameters
  const now = new Date().toISOString();
  const insertConfigOrIgnore = sqlite.prepare(`
    INSERT OR IGNORE INTO system_config (key, value, description, updated_at, updated_by)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertConfigOrIgnore.run("GLOBAL_LEVERAGE_HURDLE", "3.5", "Global Net Debt / EBITDA threshold trigger for amber/red flags", now, "SYSTEM");
  insertConfigOrIgnore.run("GLOBAL_COVERAGE_HURDLE", "2.5", "Global EBIT / Interest Expense coverage floor", now, "SYSTEM");
  insertConfigOrIgnore.run("GLOBAL_LIQUIDITY_HURDLE", "1.1", "Global Current Ratio liquidity floor", now, "SYSTEM");
  insertConfigOrIgnore.run("ALERT_MARGIN_DETERIORATION_PCT", "-5.0", "Operating margin period-over-period percentage drop alert threshold", now, "SYSTEM");
  insertConfigOrIgnore.run("ALERT_REVENUE_CONTRACTION_PCT", "-10.0", "Year-over-year revenue contraction trigger for distress surveillance", now, "SYSTEM");
  insertConfigOrIgnore.run("MAX_RATE_SHOCK_BPS", "500", "Maximum permissible interest rate shock in stress simulations (bps)", now, "SYSTEM");
  insertConfigOrIgnore.run("DEFAULT_CURRENCY", "USD", "Default institutional presentation currency", now, "SYSTEM");
  insertConfigOrIgnore.run("DEFAULT_PERIOD_TYPE", "ANNUAL", "Default filing cadence across financial statements", now, "SYSTEM");
  insertConfigOrIgnore.run("SESSION_TIMEOUT_MINUTES", "60", "Automatic inactivity logout timer", now, "SYSTEM");
  insertConfigOrIgnore.run("LOGIN_LOCKOUT_ATTEMPTS", "5", "Brute-force security lockout threshold", now, "SYSTEM");
  insertConfigOrIgnore.run("ORGANIZATION_NAME", "FINTRAXIS Institutional Risk Services", "Entity identifier for regulatory research exports", now, "SYSTEM");
  insertConfigOrIgnore.run("MAINTENANCE_MODE", "false", "Operational lockdown flag for schema re-indexing", now, "SYSTEM");
  insertConfigOrIgnore.run("RATE_LIMIT_ANALYST_RPM", "60", "Requests per minute allowed per terminal session", now, "SYSTEM");

  // Seed default system_jobs if missing
  const insertJobOrIgnore = sqlite.prepare(`
    INSERT OR IGNORE INTO system_jobs (id, name, description, category, status, last_run_at, last_duration_ms, records_processed, last_error, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertJobOrIgnore.run(
    "audit_balance_sheets",
    "Balance Sheet Identity Audit",
    "Pure arithmetic audit of Assets = Liabilities + Equity across all registered issuer balance sheets",
    "AUDIT",
    "IDLE",
    now,
    14,
    3,
    null,
    now
  );

  insertJobOrIgnore.run(
    "db_integrity",
    "Database Integrity Check & WAL Checkpoint",
    "Executes SQLite PRAGMA integrity_check and WAL log checkpoint truncation",
    "MAINTENANCE",
    "IDLE",
    now,
    8,
    1,
    null,
    now
  );

  insertJobOrIgnore.run(
    "refresh_market_quotes",
    "Security Master Pricing Synchronizer",
    "Polls verified market providers for latest trading prices and market valuations",
    "DATA_SYNC",
    "IDLE",
    now,
    42,
    3,
    null,
    now
  );

  insertJobOrIgnore.run(
    "audit_journal_verification",
    "Audit Journal Cryptographic Verification",
    "Scans security audit events to verify timestamp linearity and operator provenance",
    "SECURITY",
    "IDLE",
    now,
    5,
    10,
    null,
    now
  );
} catch (e) {
  console.warn("DB setup / migration error (non-fatal):", e);
}

if (process.env.NODE_ENV !== "production") {
  globalForDb.sqlite = sqlite;
}

export const db = drizzle(sqlite, { schema });
export { sqlite };
