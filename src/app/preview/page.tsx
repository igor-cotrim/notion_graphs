import { ChartRenderer } from "@/components/ChartRenderer";
import { PreviewForm } from "@/components/PreviewForm";
import { PreviewHint } from "@/components/PreviewHint";
import { PreviewLayoutShell } from "@/components/PreviewLayoutShell";
import { applyFilters, groupAndAggregate } from "@/lib/aggregate";
import { requireUser } from "@/lib/auth";
import { queryDatabase } from "@/lib/notion";
import {
  distinctValuesByProp,
  firstParam,
  listNumericProps,
  listStringProps,
  parseFiltersFromSearchParams,
} from "@/lib/preview";
import { loadFolderTree } from "@/lib/savedDbsRepo";
import type { Aggregation, ChartType, NormalizedRow } from "@/lib/types";

export const dynamic = "force-dynamic";

const FILTERABLE_PROPS = ["Type", "Category"];

export default async function PreviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const db = firstParam(sp.db) ?? "";
  const chart = (firstParam(sp.chart) ?? "pie") as ChartType;
  const group = firstParam(sp.group) ?? "Category";
  const value = firstParam(sp.value) ?? "Value";
  const agg = (firstParam(sp.agg) ?? "sum") as Aggregation;
  const title = firstParam(sp.title) ?? "";
  const filters = parseFiltersFromSearchParams(sp);

  let rows: NormalizedRow[] = [];
  let fetchError: string | null = null;
  const [folderTree, rowsResult] = await Promise.all([
    loadFolderTree(user.id),
    db
      ? queryDatabase(user.id, db)
          .then((r) => ({ ok: true as const, rows: r }))
          .catch((e) => ({
            ok: false as const,
            error: e instanceof Error ? e.message : String(e),
          }))
      : Promise.resolve(null),
  ]);
  if (rowsResult && rowsResult.ok) rows = rowsResult.rows;
  if (rowsResult && !rowsResult.ok) fetchError = rowsResult.error;

  const groupOptions = listStringProps(rows);
  const valueOptions = listNumericProps(rows);
  const filterOptions = distinctValuesByProp(rows, FILTERABLE_PROPS);

  const filtered = applyFilters(rows, filters);
  const data = groupAndAggregate(filtered, group, value, agg);

  return (
    <PreviewLayoutShell
      sidebar={
        <PreviewForm
          initial={{ db, chart, group, value, agg, title, filters }}
          folders={folderTree}
          groupOptions={groupOptions}
          valueOptions={valueOptions}
          filterOptions={filterOptions}
          workspaceName={user.workspaceName}
        />
      }
    >
      {!db ? (
        <PreviewHint variant="no-db" />
      ) : fetchError ? (
        <PreviewHint variant="error" errorMessage={fetchError} />
      ) : rows.length === 0 ? (
        <PreviewHint variant="empty" />
      ) : (
        <ChartRenderer type={chart} data={data} title={title || undefined} />
      )}
    </PreviewLayoutShell>
  );
}
