"use client";

import {
  Bar,
  BarChart as RBarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AggregatedPoint } from "@/lib/types";
import { totalOf } from "@/lib/format";
import { ChartTooltip } from "./ChartTooltip";
import { colorFor } from "./palette";

export function BarChart({ data }: { data: AggregatedPoint[] }) {
  const total = totalOf(data);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RBarChart data={data} margin={{ top: 16, right: 16, bottom: 16, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          cursor={{ fill: "rgba(0,0,0,0.04)" }}
          content={<ChartTooltip total={total} />}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={entry.label} fill={colorFor(i)} />
          ))}
        </Bar>
      </RBarChart>
    </ResponsiveContainer>
  );
}
