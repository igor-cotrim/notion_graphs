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
    return <EmbedMessage>Invalid embed token.</EmbedMessage>;
  }

  let data;
  try {
    const rows = await queryDatabase(config.userId, config.db);
    const filtered = applyFilters(rows, config.filters);
    data = groupAndAggregate(
      filtered,
      config.groupBy,
      config.valueProp ?? "Value",
      config.agg ?? "sum",
    );
  } catch {
    return (
      <EmbedMessage>
        This chart is no longer available — the owner disconnected their Notion
        workspace.
      </EmbedMessage>
    );
  }

  return (
    <div className="fixed inset-0 bg-white">
      <ChartRenderer type={config.chart} data={data} title={config.title} />
    </div>
  );
}

function EmbedMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white p-6 text-center text-sm text-gray-500">
      {children}
    </div>
  );
}
