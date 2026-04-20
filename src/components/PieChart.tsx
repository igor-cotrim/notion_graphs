"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart as RPieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { AggregatedPoint } from "@/lib/types";
import { totalOf } from "@/lib/format";
import { ChartTooltip } from "./ChartTooltip";
import { colorFor } from "./palette";

type SliceLabelProps = {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  name: string;
};

function renderSliceLabel(props: unknown) {
  const p = props as SliceLabelProps;
  if (p.percent < 0.04) return null;
  const RAD = Math.PI / 180;
  const r = p.innerRadius + (p.outerRadius - p.innerRadius) * 0.6;
  const x = p.cx + r * Math.cos(-p.midAngle * RAD);
  const y = p.cy + r * Math.sin(-p.midAngle * RAD);
  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={600}
      style={{ pointerEvents: "none" }}
    >
      {`${Math.round(p.percent * 100)}%`}
    </text>
  );
}

export function PieChart({ data }: { data: AggregatedPoint[] }) {
  const total = totalOf(data);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RPieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          cx="50%"
          cy="45%"
          outerRadius="80%"
          paddingAngle={1}
          stroke="#fff"
          strokeWidth={2}
          label={renderSliceLabel}
          labelLine={false}
          isAnimationActive={false}
        >
          {data.map((entry, i) => (
            <Cell key={entry.label} fill={colorFor(i)} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip total={total} />} />
        <Legend
          verticalAlign="bottom"
          align="center"
          iconType="circle"
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
      </RPieChart>
    </ResponsiveContainer>
  );
}
