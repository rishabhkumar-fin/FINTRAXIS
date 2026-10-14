import type { DataProvider } from "./DataProvider.ts";
import { YahooFinanceAdapter } from "./YahooFinanceAdapter.ts";

export type * from "./DataProvider.ts";
export * from "./YahooFinanceAdapter.ts";

// Default DataProvider registry with Yahoo Finance adapter
export const primaryDataProvider: DataProvider = new YahooFinanceAdapter();
