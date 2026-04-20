import { ChartRenderer } from "@/components/ChartRenderer";
import { applyFilters, groupAndAggregate } from "@/lib/aggregate";
import { decodeConfig } from "@/lib/config";
import { queryDatabase } from "@/lib/notion";

export const revalidate = 60;

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ config: string }>;
}) {
  const { config: token } = await params;

  let config;
  try {
    config = decodeConfig(token);
  } catch {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-white text-sm text-gray-500">
        Invalid embed token.
      </div>
    );
  }

  const rows = await queryDatabase(config.db);
  const filtered = applyFilters(rows, config.filters);
  const data = groupAndAggregate(
    filtered,
    config.groupBy,
    config.valueProp ?? "Value",
    config.agg ?? "sum",
  );

  return (
    <div className="h-dvh w-full">
      <ChartRenderer type={config.chart} data={data} title={config.title} />
    </div>
  );
}
