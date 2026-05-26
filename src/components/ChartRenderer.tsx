"use client";

import type { AggregatedPoint, ChartType } from "@/lib/types";
import { useLocale } from "@/hooks/useLocale";
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
  const { t } = useLocale();
  return (
    <div className="flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden bg-white p-3 sm:p-4">
      {title ? (
        <h1 className="mb-1 px-1 text-xs font-semibold text-zinc-500 sm:mb-2 sm:px-2 sm:text-sm">
          {title}
        </h1>
      ) : null}
      <div className="min-h-0 min-w-0 flex-1">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            {t("chart.noData")}
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
