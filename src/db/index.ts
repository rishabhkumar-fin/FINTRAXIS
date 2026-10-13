import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const dbDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "fintraxis.db");

// Singleton connection for Next.js hot reload safety
const globalForDb = globalThis as unknown as {
  sqlite: Database.Database | undefined;
};

const sqlite =
  globalForDb.sqlite ??
  new Database(dbPath, {
    verbose: process.env.NODE_ENV === "development" ? undefined : undefined,
  });

// Enable WAL mode for high concurrency read/writes
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("synchronous = NORMAL");

// Ensure users table exists
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
    created_at TEXT NOT NULL
  );
`);

if (process.env.NODE_ENV !== "production") {
  globalForDb.sqlite = sqlite;
}

export const db = drizzle(sqlite, { schema });
export { sqlite };
