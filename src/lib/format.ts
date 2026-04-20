export function fmtNumber(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function fmtPct(p: number): string {
  return `${(p * 100).toFixed(1)}%`;
}

export function totalOf(values: { value: number }[]): number {
  let t = 0;
  for (const v of values) t += v.value;
  return t;
}
