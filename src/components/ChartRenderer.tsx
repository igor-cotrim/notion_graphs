"use client";

import type { AggregatedPoint, ChartType } from "@/lib/types";
import { BarChart } from "./BarChart";
import { LineChart } from "./LineChart";
import { PieChart } from "./PieChart";

export function ChartRenderer({
  type,
  data,
  title,
}: {
  type: ChartType;
  data: AggregatedPoint[];
  title?: string;
}) {
  return (
    <div className="flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden bg-white p-4">
      {title ? (
        <h1 className="mb-2 px-2 text-sm font-semibold text-gray-700">{title}</h1>
      ) : null}
      <div className="min-h-0 min-w-0 flex-1">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            No data.
          </div>
        ) : type === "pie" ? (
          <PieChart data={data} />
        ) : type === "bar" ? (
          <BarChart data={data} />
        ) : (
          <LineChart data={data} />
        )}
      </div>
    </div>
  );
}
