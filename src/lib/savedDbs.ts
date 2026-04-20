import type { Aggregation, ChartType } from "./types";

export type StoredDbState = {
  chart: ChartType;
  group: string;
  value: string;
  agg: Aggregation;
  title: string;
  filters: Record<string, string[]>;
};

export type SavedDb = {
  label: string;
  id: string;
  state?: StoredDbState;
};

const STORAGE_KEY = "notion-graphs:dbs";

export function loadSavedDbs(): SavedDb[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is SavedDb =>
        !!x &&
        typeof (x as SavedDb).label === "string" &&
        typeof (x as SavedDb).id === "string",
    );
  } catch {
    return [];
  }
}

export function persistSavedDbs(items: SavedDb[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function updateDbState(id: string, state: StoredDbState): void {
  if (typeof window === "undefined") return;
  const items = loadSavedDbs();
  const i = items.findIndex((x) => x.id === id);
  if (i < 0) return;
  items[i] = { ...items[i], state };
  persistSavedDbs(items);
}
