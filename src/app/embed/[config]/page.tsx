import type { Metadata } from "next";
import { ChartRenderer } from "@/components/ChartRenderer";
import { applyFilters, groupAndAggregate } from "@/lib/aggregate";
import { decodeConfig, decodeEmbedRef } from "@/lib/config";
import { queryDatabase } from "@/lib/notion";
import { loadSavedDbForEmbed } from "@/lib/savedDbsRepo";
import type { EmbedConfig } from "@/lib/types";

function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL ?? "").replace(/\/$/, "");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ config: string }>;
}): Promise<Metadata> {
  const { config: token } = await params;
  const base = getBaseUrl();
  const embedUrl = `${base}/embed/${token}`;
  const oembedUrl = `${base}/api/oembed?url=${encodeURIComponent(embedUrl)}&format=json`;
  return {
    alternates: {
      types: {
        "application/json+oembed": oembedUrl,
      },
    },
  };
}

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ config: string }>;
}) {
  const { config: token } = await params;

  let config: EmbedConfig | null = null;
  let unavailable: string | null = null;
  try {
    const ref = decodeEmbedRef(token);
    const row = await loadSavedDbForEmbed(ref.savedDbId);
    if (!row || row.userId !== ref.userId) {
      unavailable = "This chart is no longer available.";
    } else if (!row.state) {
      unavailable = "This chart has no saved state yet.";
    } else {
      config = {
        userId: row.userId,
        db: row.notionDbId,
        chart: row.state.chart,
        groupBy: row.state.group,
        valueProp: row.state.value,
        agg: row.state.agg,
        title: row.state.title,
        filters: row.state.filters,
      };
    }
  } catch {
    try {
      config = decodeConfig(token);
    } catch {
      unavailable = "Invalid embed token.";
    }
  }

  if (unavailable) return <EmbedMessage>{unavailable}</EmbedMessage>;
  if (!config) return <EmbedMessage>Invalid embed token.</EmbedMessage>;

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
    <main className="h-dvh min-h-[500px] w-full bg-white">
      <ChartRenderer type={config.chart} data={data} title={config.title} />
    </main>
  );
}

function EmbedMessage({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex h-dvh min-h-[200px] w-full items-center justify-center bg-white p-6 text-center text-sm text-gray-500">
      {children}
    </main>
  );
}
