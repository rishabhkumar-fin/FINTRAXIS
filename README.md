# FINTRAXIS
### Financial Intelligence and Credit Risk Analysis Platform

**FINTRAXIS** is a full-stack financial intelligence platform designed to help users analyse corporate financial performance, assess credit-related risks and examine factors that may affect a company's financial stability.

The platform brings company intelligence, financial statement analysis, vulnerability screening, business dependency analysis, concentration assessment and scenario simulation into one integrated research environment.

Its objective is to make corporate financial analysis more structured, accessible and evidence-based, while maintaining transparency around financial data, calculations and assumptions.

**GitHub Repository:** [github.com/rishabhkumar-fin/FINTRAXIS](https://github.com/rishabhkumar-fin/FINTRAXIS)

---

## Platform Overview

Understanding a company's financial position requires more than reviewing individual financial ratios. It involves examining financial statements, identifying changes in performance, evaluating business dependencies and understanding potential sources of risk.

FINTRAXIS brings these areas together through a connected company research workflow.

Users can select a company, examine its available financial information, assess financial health, investigate potential vulnerabilities, review business exposure and explore hypothetical financial scenarios.

## Core Modules

### 1. Company Intelligence

Provides a central workspace for company research.

- Search for companies and access available company information.
- Review company profiles and relevant financial data.
- Organise analysis around a selected company.
- Access company-related information through a common workspace.

### 2. Financial Health Analysis

Examines a company's financial position through key financial indicators.

Areas of analysis include:

- Revenue and growth
- Profitability
- Liquidity
- Debt and leverage
- Cash flow

The module helps users understand financial performance through reported figures and relevant financial metrics.

### 3. Vulnerability Screening

Identifies financial indicators that may require further investigation.

- Examine changes in financial performance.
- Identify potential areas of financial weakness.
- Review the metrics behind individual risk signals.
- Support investigation through available financial evidence.

Risk indicators are analytical signals and should not be interpreted as guaranteed predictions.

### 4. Business Dependency Intelligence

Examines available information about business relationships that may influence a company's operations.

- Review disclosed supplier and customer relationships.
- Examine available business dependency information.
- Identify relationships that may warrant further investigation.

Analysis is limited to the availability and reliability of disclosed information.

### 5. Concentration and Exposure Analysis

Examines potential concentration within a company's business structure.

- Review available customer and supplier concentration information.
- Examine segment and geographic exposure where data is available.
- Identify potential areas of concentrated business exposure.

Concentration metrics should only be calculated when the underlying information is sufficiently complete.

### 6. Scenario and Resilience Simulation

Allows users to explore hypothetical changes in financial conditions.

Examples include:

- Revenue decline
- Increase in operating costs
- Changes in financial assumptions
- Comparison of baseline and stressed financial outcomes

Scenario results represent sensitivity analysis based on specified inputs, not guaranteed forecasts.

---

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React |
| Programming Language | TypeScript |
| Frontend Tooling | Vite |
| Backend | Node.js |
| API Framework | Express |
| Database | SQLite |
| Server Development | tsx |

## Project Structure

```text
FINTRAXIS/
│
├── client/
│   └── Frontend application
│
├── server/
│   └── src/
│       ├── analytics/
│       │   └── calculations.ts
│       │
│       ├── db/
│       │   ├── schema.ts
│       │   ├── database.ts
│       │   └── seed.ts
│       │
│       ├── modulesData.ts
│       └── index.ts
│
├── package.json
├── package-lock.json
└── README.md
```

The frontend handles the user interface and presentation of analytical results. The backend manages application routes, data operations and financial calculations, while SQLite provides local relational data storage.

## Data Integrity and Analytical Approach

Financial analysis depends on the quality and completeness of its underlying information.

FINTRAXIS follows these principles:

- **Source awareness:** Financial information should retain its source context.
- **Reporting periods:** Financial figures should be associated with their relevant reporting periods.
- **Transparent calculations:** Derived metrics should use identifiable inputs and calculation logic.
- **Missing information:** Unavailable data should not be silently replaced with invented values.
- **Clear assumptions:** Hypothetical scenario inputs should remain distinguishable from reported financial information.
- **Responsible interpretation:** Risk indicators should support further investigation rather than imply certainty.

Financial and market-data coverage depends on the configured data provider, company and reporting jurisdiction.

## Getting Started

### Prerequisites

- Node.js
- npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/rishabhkumar-fin/FINTRAXIS.git
```

### 2. Navigate to the project directory

```bash
cd FINTRAXIS
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create the required environment file:

```text
server/.env
```

Add the API credentials required by the data providers configured in the application.

For example, if Financial Modeling Prep is enabled:

```env
FMP_API_KEY=your_api_key_here
```

Never commit API keys, passwords, session secrets or private configuration files to GitHub.

### 5. Start the application

```bash
npm run dev
```

The development environment starts the frontend and backend using the project's configured scripts.

Default local addresses:

| Service | Address |
|---|---|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:5000 |
| Backend Health Check | http://localhost:5000/api/health |

The actual ports may differ depending on the project configuration.

## Testing and Build

Run the configured test suite:

```bash
npm test
```

Build the backend:

```bash
npm run build:server
```

Build the frontend:

```bash
npm run build:client
```

These commands use the scripts defined in the root `package.json`.

## Development Priorities

FINTRAXIS is being developed with the following engineering priorities:

1. **Maintainable architecture** — organise responsibilities across frontend, backend and data layers.
2. **Reliable financial calculations** — use identifiable inputs and consistent calculation logic.
3. **Data transparency** — distinguish reported information from derived results and hypothetical assumptions.
4. **Usable financial research** — present complex financial information in a clear and understandable manner.
5. **Responsible credit risk analysis** — avoid unsupported conclusions when information is incomplete.

## Project Information

| | |
|---|---|
| Project Name | FINTRAXIS |
| Tagline | Financial Intelligence and Credit Risk Analysis Platform |
| Domain | Financial Technology |
| Focus | Corporate Financial Intelligence and Credit Risk Analysis |
| Application | Full-stack Web Application |
| Primary Language | TypeScript |
| Repository Owner | [rishabhkumar-fin](https://github.com/rishabhkumar-fin) |

---

**FINTRAXIS**

*Financial Intelligence and Credit Risk Analysis Platform.*
