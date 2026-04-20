"use client";

import { fmtNumber, fmtPct } from "@/lib/format";

type Item = {
  name?: string;
  value?: number;
  payload?: { label?: string; value?: number };
  color?: string;
};

export function ChartTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: Item[];
  total: number;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const label = item.payload?.label ?? item.name ?? "";
  const value = item.value ?? item.payload?.value ?? 0;
  const pct = total > 0 ? value / total : 0;
  return (
    <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs shadow-sm">
      <div className="flex items-center gap-2 font-medium text-zinc-900">
        {item.color ? (
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: item.color }}
          />
        ) : null}
        {label}
      </div>
      <div className="mt-1 text-zinc-600">
        {fmtNumber(value)} <span className="text-zinc-400">·</span>{" "}
        {fmtPct(pct)}
      </div>
    </div>
  );
}
