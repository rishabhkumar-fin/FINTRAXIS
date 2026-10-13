export interface ModuleConfig {
  id: string;
  number: string;
  name: string;
  shortDesc: string;
  iconName: string;
  componentKey: string;
  deskTag: string;
}

export const MODULE_REGISTRY: ModuleConfig[] = [
  {
    id: "hub",
    number: "01",
    name: "Securities Directory",
    shortDesc: "Global Master & Multi-Currency Ingestion",
    iconName: "Building2",
    componentKey: "CompanyHub",
    deskTag: "SECURITIES MASTER",
  },
  {
    id: "ledger",
    number: "02",
    name: "Financial Statements & XBRL",
    shortDesc: "3-Statement Multi-Period Ledger",
    iconName: "FileSpreadsheet",
    componentKey: "StatementsLedger",
    deskTag: "XBRL AUDIT TRAIL",
  },
  {
    id: "health",
    number: "03",
    name: "Credit Risk & Solvency",
    shortDesc: "Default Health & Capital Multiples",
    iconName: "Activity",
    componentKey: "HealthRatios",
    deskTag: "SOLVENCY HEALTH",
  },
  {
    id: "vulnerability",
    number: "04",
    name: "Early Warning Surveillance",
    shortDesc: "Basel III & Covenant Trigger Flags",
    iconName: "ShieldAlert",
    componentKey: "VulnerabilityMonitor",
    deskTag: "BASEL III EWS",
  },
  {
    id: "stress",
    number: "05",
    name: "Macro Stress Testing",
    shortDesc: "Stagflation & Monetary Shock Lab",
    iconName: "SlidersHorizontal",
    componentKey: "StressSimulator",
    deskTag: "CAPITAL SIMULATION",
  },
  {
    id: "ic",
    number: "06",
    name: "Investment Committee Memo & PDF",
    shortDesc: "Boardroom Credit Tearsheet & Deck",
    iconName: "FileText",
    componentKey: "ICDossier",
    deskTag: "IC BOARDROOM MEMO",
  },
];

export type ModuleId = "hub" | "ledger" | "health" | "vulnerability" | "stress" | "ic";
