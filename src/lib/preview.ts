import type { NormalizedRow } from "./types";

export type PreviewFilters = Record<string, string[]>;

export function firstParam(
  v: string | string[] | undefined,
): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export function parseFiltersFromSearchParams(
  sp: Record<string, string | string[] | undefined>,
): PreviewFilters {
  const filters: PreviewFilters = {};
  const raw = sp.filter;
  const all = Array.isArray(raw) ? raw : raw ? [raw] : [];
  for (const spec of all) {
    const i = spec.indexOf(":");
    if (i < 0) continue;
    const key = spec.slice(0, i);
    const values = spec
      .slice(i + 1)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (key && values.length) filters[key] = values;
  }
  return filters;
}

const RESERVED_KEYS = new Set(["id"]);

export function listStringProps(rows: NormalizedRow[]): string[] {
  const keys = new Set<string>();
  for (const row of rows) {
    for (const [k, v] of Object.entries(row)) {
      if (RESERVED_KEYS.has(k)) continue;
      if (typeof v === "string") keys.add(k);
    }
  }
  return [...keys].sort();
}

export function listNumericProps(rows: NormalizedRow[]): string[] {
  const keys = new Set<string>();
  for (const row of rows) {
    for (const [k, v] of Object.entries(row)) {
      if (RESERVED_KEYS.has(k)) continue;
      if (typeof v === "number") keys.add(k);
    }
  }
  return [...keys].sort();
}

export function distinctValuesByProp(
  rows: NormalizedRow[],
  props: string[],
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const p of props) {
    const set = new Set<string>();
    for (const row of rows) {
      const v = row[p];
      if (typeof v === "string" && v) set.add(v);
    }
    out[p] = [...set].sort();
  }
  return out;
}
