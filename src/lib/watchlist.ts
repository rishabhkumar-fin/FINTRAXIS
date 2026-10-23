"use client";

const WATCHLIST_STORAGE_KEY = "fintraxis_watchlist";
const WATCHLIST_EVENT_NAME = "fintraxis_watchlist_change";

export function getWatchlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isTickerInWatchlist(ticker: string): boolean {
  if (!ticker) return false;
  const list = getWatchlist();
  const clean = ticker.toUpperCase();
  return list.some((item) => item.toUpperCase() === clean);
}

export function addTickerToWatchlist(ticker: string): boolean {
  if (typeof window === "undefined" || !ticker) return false;
  const list = getWatchlist();
  const clean = ticker.toUpperCase();
  if (!list.some((item) => item.toUpperCase() === clean)) {
    const updated = [...list, clean];
    try {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(WATCHLIST_EVENT_NAME, { detail: updated }));
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export function removeTickerFromWatchlist(ticker: string): boolean {
  if (typeof window === "undefined" || !ticker) return false;
  const list = getWatchlist();
  const clean = ticker.toUpperCase();
  const updated = list.filter((item) => item.toUpperCase() !== clean);
  if (updated.length !== list.length) {
    try {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(WATCHLIST_EVENT_NAME, { detail: updated }));
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export function toggleTickerInWatchlist(ticker: string): { inWatchlist: boolean; changed: boolean } {
  if (isTickerInWatchlist(ticker)) {
    removeTickerFromWatchlist(ticker);
    return { inWatchlist: false, changed: true };
  } else {
    addTickerToWatchlist(ticker);
    return { inWatchlist: true, changed: true };
  }
}

export function subscribeToWatchlist(callback: (watchlist: string[]) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => {
    const custom = e as CustomEvent<string[]>;
    callback(custom.detail || getWatchlist());
  };
  window.addEventListener(WATCHLIST_EVENT_NAME, handler);
  return () => window.removeEventListener(WATCHLIST_EVENT_NAME, handler);
}
