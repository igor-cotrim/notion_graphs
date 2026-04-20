import type { AggregatedPoint, Aggregation, NormalizedRow } from "./types";

export function applyFilters(
  rows: NormalizedRow[],
  filters: Record<string, string[]> | undefined,
): NormalizedRow[] {
  if (!filters || Object.keys(filters).length === 0) return rows;
  return rows.filter((row) =>
    Object.entries(filters).every(([key, allowed]) => {
      if (!allowed.length) return true;
      const v = row[key];
      return v != null && allowed.includes(String(v));
    }),
  );
}

export function groupAndAggregate(
  rows: NormalizedRow[],
  groupBy: string,
  valueProp: string | undefined,
  agg: Aggregation = "sum",
): AggregatedPoint[] {
  const buckets = new Map<string, { sum: number; count: number }>();

  for (const row of rows) {
    const rawLabel = row[groupBy];
    if (rawLabel == null) continue;
    const label = String(rawLabel);

    let value = 1;
    if (agg !== "count") {
      if (!valueProp) continue;
      const v = row[valueProp];
      if (typeof v !== "number") continue;
      value = v;
    }

    const bucket = buckets.get(label) ?? { sum: 0, count: 0 };
    bucket.sum += value;
    bucket.count += 1;
    buckets.set(label, bucket);
  }

  const points: AggregatedPoint[] = [];
  for (const [label, { sum, count }] of buckets) {
    let value: number;
    switch (agg) {
      case "count":
        value = count;
        break;
      case "avg":
        value = count ? sum / count : 0;
        break;
      default:
        value = sum;
    }
    points.push({ label, value: roundCents(value) });
  }

  points.sort((a, b) => b.value - a.value);
  return points;
}

function roundCents(n: number): number {
  return Math.round(n * 100) / 100;
}
