export interface ModuleConfig {
  id: string;
  number: string;
  name: string;
  shortDesc: string;
  iconName: string;
  componentKey: string;
}

export const MODULE_REGISTRY: ModuleConfig[] = [
  {
    id: "hub",
    number: "01",
    name: "Security Master",
    shortDesc: "Global Ingestion & Live HUD",
    iconName: "Building2",
    componentKey: "CompanyHub",
  },
  {
    id: "ledger",
    number: "02",
    name: "Financial Ledger & XBRL",
    shortDesc: "3-Statement Audit Trail",
    iconName: "FileSpreadsheet",
    componentKey: "StatementsLedger",
  },
  {
    id: "health",
    number: "03",
    name: "Solvency & Health DAG",
    shortDesc: "Deterministic Ratio Engine",
    iconName: "Activity",
    componentKey: "HealthRatios",
  },
  {
    id: "vulnerability",
    number: "04",
    name: "Vulnerability Monitor",
    shortDesc: "Basel III & Covenant Flags",
    iconName: "ShieldAlert",
    componentKey: "VulnerabilityMonitor",
  },
  {
    id: "stress",
    number: "05",
    name: "Stress Simulator",
    shortDesc: "Parametric Shock Engine",
    iconName: "SlidersHorizontal",
    componentKey: "StressSimulator",
  },
  {
    id: "ic",
    number: "06",
    name: "IC Underwriting Dossier",
    shortDesc: "Boardroom Credit Tearsheet",
    iconName: "FileText",
    componentKey: "ICDossier",
  },
];

export type ModuleId = "hub" | "ledger" | "health" | "vulnerability" | "stress" | "ic";
