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
  `);

  try {
    sqlite.exec(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'ANALYST';`);
  } catch {
    // Column already exists
  }

  // Seed default system_config if missing
  const countRow = sqlite.prepare("SELECT count(*) as count FROM system_config").get() as { count: number } | undefined;
  if (!countRow || countRow.count === 0) {
    const now = new Date().toISOString();
    const insertConfig = sqlite.prepare(`
      INSERT INTO system_config (key, value, description, updated_at, updated_by)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertConfig.run("GLOBAL_LEVERAGE_HURDLE", "3.5", "Global Net Debt / EBITDA threshold trigger for amber/red flags", now, "SYSTEM");
    insertConfig.run("GLOBAL_COVERAGE_HURDLE", "2.5", "Global EBIT / Interest Expense coverage floor", now, "SYSTEM");
    insertConfig.run("GLOBAL_LIQUIDITY_HURDLE", "1.1", "Global Current Ratio liquidity floor", now, "SYSTEM");
    insertConfig.run("MAINTENANCE_MODE", "false", "Operational lockdown flag for schema re-indexing", now, "SYSTEM");
    insertConfig.run("RATE_LIMIT_ANALYST_RPM", "60", "Requests per minute allowed per terminal session", now, "SYSTEM");
  }
} catch (e) {
  console.warn("DB setup / migration error (non-fatal):", e);
}

if (process.env.NODE_ENV !== "production") {
  globalForDb.sqlite = sqlite;
}

export const db = drizzle(sqlite, { schema });
export { sqlite };
