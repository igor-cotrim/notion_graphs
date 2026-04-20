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
import { totalOf } from "@/lib/format";
import { ChartTooltip } from "./ChartTooltip";
import { colorFor } from "./palette";

export function LineChart({ data }: { data: AggregatedPoint[] }) {
  const total = totalOf(data);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RLineChart data={data} margin={{ top: 16, right: 16, bottom: 16, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          cursor={{ stroke: "#d4d4d8" }}
          content={<ChartTooltip total={total} />}
        />
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
