# FINTRAXIS — Technical Architecture, Trade-Offs & Viva Voce Defense

*Version: Phase 9 Benchmark Accord*  
*Date: October 22, 2026*

---

## 1. Database Architecture: Embedded SQLite with Drizzle ORM

### Why Embedded SQLite Was Chosen
1. **Zero External Operational Dependency:** Eliminates third-party database network hops, cloud connection quotas, and hosted database latency during local development, test automation, and offline evaluation.
2. **Deterministic, Millisecond In-Memory / File Reads:** SQLite executing in WAL (Write-Ahead Logging) mode reads directly from disk/memory in sub-millisecond latency ($< 0.5\text{ms}$), enabling fast computation across financial ratio trees.
3. **Type-Safe ORM Abstraction:** Drizzle ORM provides full TypeScript compile-time type safety with zero query generation overhead and raw SQL performance.
4. **Appropriate for Compact Institutional Datasets:** Corporate master tables and 3-year statutory disclosures represent small, high-density structured datasets ($< 50\text{MB}$) where embedded relational storage is optimal.

### Real Operational Limits of Embedded SQLite
- **Concurrency Bottlenecks:** While SQLite handles unlimited concurrent readers via WAL mode, write operations are strictly serialized via a single database-level lock. Under heavy multi-user data ingestion, concurrent writes queue or timeout (`SQLITE_BUSY`).
- **No Native Distributed Replication:** SQLite has no native master-replica replication or clustering without extensions (e.g., LiteFS or Bedrock).
- **Ephemeral Storage on Serverless Runtimes:** Serverless environments execute containers on read-only images, preventing durable disk writes.

---

## 2. Serverless Runtime Behavior on Vercel

### The Ephemeral Filesystem Reality
1. **Read-Only App Bundle:** On Vercel, the application files deployed in the Lambda container are mounted on a strictly read-only virtual filesystem.
2. **Temporary `/tmp` Buffer:** Writes are only permitted inside `/tmp` (a 512MB RAM-backed ephemeral scratch directory).
3. **Container Lifecycles & Cold Starts:** When an analyst creates a new user, updates credentials, or ingests an issuer via `/api/companies/ingest`, the mutation writes to `/tmp/fintraxis.db`. However:
   - When the Lambda instance goes idle, the container is destroyed.
   - When traffic scales horizontally, requests route to different container instances with separate `/tmp` directories.
   - A subsequent request may hit a freshly initialized instance where `/tmp` was re-copied from the seed bundle, reverting uncommitted changes.
4. **Why the Demo Notice Is Displayed:** FINTRAXIS explicitly displays a banner stating that the live environment is an institutional evaluation sandbox. It explains that new ingests and user profile changes are session-bound and do not persist across serverless container recycles.

---

## 3. Real Production Migration Path (Turso vs PostgreSQL)

*Honesty Accord: Migrating to a production multi-tenant database is not a "one connection string" change. The concrete steps and engineering effort required are documented below.*

### Path A: libSQL / Turso (HTTP-Based Distributed SQLite)
- **Architectural Fit:** Closest to current code; preserves SQLite syntax and dialect.
- **Concrete Steps Required:**
  1. Replace `better-sqlite3` dependency with `@libsql/client`.
  2. In `src/db/index.ts`, replace `drizzle(sqlite)` with `drizzle(createClient({ url, authToken }))`.
  3. Export local `data/fintraxis.db` via `.dump` and import into a Turso hosted database.
  4. Update Vercel environment variables with `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.
- **Engineering Effort:** ~1 to 2 developer days (low friction, high compatibility).

### Path B: PostgreSQL (Neon / Supabase / AWS Aurora Serverless)
- **Architectural Fit:** Enterprise multi-tenant standard with robust connection pooling.
- **Concrete Steps Required:**
  1. Replace `drizzle-orm/sqlite-core` table definitions in `src/db/schema.ts` with `drizzle-orm/pg-core` (`pgTable`, `text()`, `numeric()`, `timestamp()`, `serial()`).
  2. Replace `better-sqlite3` with `@neondatabase/serverless` or `pg` with `pg-pool`.
  3. Re-run `drizzle-kit generate:pg` to produce PostgreSQL-compliant migration SQL.
  4. Write an ETL script to translate SQLite types (e.g., text timestamps and SQLite boolean reals) into PostgreSQL native `TIMESTAMPTZ` and `BOOLEAN`.
  5. Refactor application queries that use SQLite-specific syntax (e.g. `INSERT OR IGNORE`) to PostgreSQL `ON CONFLICT DO NOTHING`.
- **Engineering Effort:** ~4 to 7 developer days (moderate effort; requires schema re-typing and integration regression testing).

---

## 4. AI Copilot: Grounded Execution vs Deterministic Fallback

### How It Works Under the Hood
1. **Context Assembly from Primary Cache:**
   When an analyst queries the Copilot, `src/app/api/ai/chat/route.ts` extracts the active company ticker, queries local SQLite for audited financial statements, calculates verified ratios, and pulls regulatory dependencies.
2. **Grounded Prompting with Strict Negative Constraints:**
   When `GEMINI_API_KEY` is present, the assembled context is injected into a strict system prompt instructing the model:
   - *"Always use verified figures from the Evidence Context."*
   - *"NEVER fabricate financial numbers, counterparties, citations, or formulas. If a requested metric is not disclosed, explicitly state: 'This metric is not disclosed in current regulatory filings.'"*
3. **Local Deterministic Knowledge Engine (Fallback Mode):**
   When no external API key is configured or when the external network times out:
   - Core financial concepts (e.g. EBITDA, Altman Z, Interest Coverage, DSCR) resolve through pure TypeScript keyword and token parsers (`src/lib/financeKnowledgeBase.ts`).
   - Stress simulation queries (e.g. "simulate a 20% revenue drop") directly invoke the mathematical simulation engine (`runStressSimulation`).
   - It outputs verified, deterministic answers with zero hallucination risk.
4. **Honest Limitations:**
   The Copilot cannot interpret qualitative disclosures outside the database, cannot predict future stock movements, and can be incomplete when asked open-ended queries not covered by its deterministic rules or prompt context.

---

## 5. UI Architecture: Independent Analytical Desks vs Sequential Wizards

### Design Decision
In retail software, multi-step wizards (`Step 1 -> Step 2 -> Step 3`) guide novice users through linear onboarding. In institutional credit analysis (Bloomberg, FactSet, CapIQ), analysts do not work in linear sequences. A credit analyst may need to:
- Jump immediately to **Vulnerability Monitor** to check debt maturity rollover.
- Open **Concentration Exposure** to evaluate customer dependencies.
- Inspect **Investment Committee Dossier** for boardroom tearsheets.

### The Trade-Off & Mitigations
- **Trade-Off:** Non-sequential workstations give complete analytical freedom but introduce the risk that an analyst skips checking critical prerequisites (such as reviewing as-of filing dates or accounting standards).
- **Mitigations Implemented:**
  1. **Collapsible "About this module" Panels:** Provide 3-line summaries of *What it shows*, *Where data comes from*, and *How to read it*.
  2. **Institutional Header Accord:** Every desk explicitly surfaces reporting currency, filing dates, and accounting standard.
  3. **Help & Concept Glossary (`?` shortcut):** Instantly accessible from any screen without losing context.
  4. **5-Step Skippable Onboarding Tour:** Guides first-time users through the terminal workflow upon login.

---

## 6. Hard Questions an Examiner May Ask (Viva Voce Preparation)

**Q1: Where does each financial figure come from, and how do you prevent data fabrication?**
> *"Every financial figure in FINTRAXIS is tagged with its source filing form, filing date, scale unit, reporting currency, and regulatory repository link. If an issuer omits a line item—such as scheduled debt principal repayments—our calculation engine returns `MISSING_INPUT` and renders `'N/D'` rather than inventing numbers or defaulting to zero."*

**Q2: What is not independently verified in your current deployment?**
> *"Our core balance sheet and income statement items for Apple and Reliance are verified against Form 10-K and Ind-AS filings. However, secondary disclosures—such as itemized bond indenture tranches, quarterly promoter share pledges, and Schedule III receivables ageing—are explicitly labeled as `'Not independently verified'` or `'Demonstration / Illustrative'`, and catalogued in `docs/MANUAL_VERIFICATION_CHECKLIST.md`."*

**Q3: How does FINTRAXIS differ from a credit rating agency like CRISIL or Moody's?**
> *"CRISIL and Moody's issue subjective, committee-driven credit ratings that incorporate qualitative management interviews, factory visits, and proprietary scorecards. FINTRAXIS does not issue credit ratings; it is an objective, deterministic screening terminal that calculates verified financial metrics, flags covenant headroom breaches, and simulates mathematical stress shocks."*

**Q4: What are the theoretical limitations of Altman Z'' and Beneish M-Score in your app?**
> *"Altman Z'' was calibrated on historical non-manufacturing and emerging-market corporates; it is invalid for banks and NBFCs, which FINTRAXIS enforces by throwing `NOT_APPLICABLE`. Beneish M-Score is a probabilistic accrual screening model that flags aggressive accounting, but it does not constitute legal proof of fraud or intentional manipulation."*

**Q5: Why are covenant hurdles and reference thresholds user-adjustable rather than hardcoded?**
> *"Credit appetite varies across lenders: an NBFC financing a promoter against shares may tolerate a higher leverage multiple than a conservative commercial bank syndicate. Hardcoding regulatory thresholds would be inaccurate, so FINTRAXIS provides industry reference defaults (e.g. 3.50x Net Debt/EBITDA, 1.10x Current Ratio) while allowing credit officers to adjust hurdles to match their credit policy."*

**Q6: What would break if FINTRAXIS were deployed to 10,000 concurrent analysts right now?**
> *"Read operations would perform well because SQLite WAL mode allows concurrent readers and static Next.js assets are served from the edge. However, concurrent administrative writes—such as ingesting companies or updating risk policies—would encounter SQLite database-level write locks. Scaling to 10,000 analysts requires moving to a hosted database with connection pooling like PostgreSQL (Neon) or distributed SQLite (Turso)."*

---

## 7. Known Limitations

1. **Local Filing Scope:** The current master database contains complete historical disclosures for representative corporate issuers (Reliance Industries, Apple Inc., Tata Consultancy Services, Microsoft). It is not a live firehose of the entire BSE 500 or S&P 500.
2. **Serverless Ephemeral Writes:** Mutations made through the browser on Vercel do not persist across Lambda container reboots.
3. **Illustrative Debt Maturity Schedules:** Contractual tranche maturity profiles are simulated proxies pending manual parsing of multi-page debt indenture notes.
4. **SEC EDGAR Live Lookup Requirement:** Direct SEC EDGAR API queries require setting a descriptive `SEC_EDGAR_USER_AGENT` environment variable in accordance with SEC fair-access policies.
