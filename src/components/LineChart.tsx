"use client";

import {
  CartesianGrid,
  Line,
  LineChart as RLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AggregatedPoint } from "@/lib/types";
import { colorFor } from "./palette";

export function LineChart({ data }: { data: AggregatedPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RLineChart data={data} margin={{ top: 16, right: 16, bottom: 16, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v) => Number(v).toLocaleString()} />
        <Line
          type="monotone"
          dataKey="value"
          stroke={colorFor(0)}
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </RLineChart>
    </ResponsiveContainer>
  );
}
