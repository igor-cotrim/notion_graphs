import { Client } from "@notionhq/client";
import { unstable_cache } from "next/cache";
import type { NormalizedRow } from "./types";

export const notion = new Client({ auth: process.env.NOTION_TOKEN });

type AnyProp = Record<string, unknown> & { type: string };

function readProp(prop: AnyProp | undefined): string | number | null {
  if (!prop) return null;
  const p = prop as unknown as Record<string, unknown>;
  switch (prop.type) {
    case "number":
      return (p.number as number | null) ?? null;
    case "select":
      return (p.select as { name: string } | null)?.name ?? null;
    case "status":
      return (p.status as { name: string } | null)?.name ?? null;
    case "multi_select": {
      const items = (p.multi_select as { name: string }[]) ?? [];
      return items.length ? items.map((i) => i.name).join(", ") : null;
    }
    case "date":
      return (p.date as { start: string } | null)?.start ?? null;
    case "title": {
      const items = (p.title as { plain_text: string }[]) ?? [];
      return items.length ? items.map((i) => i.plain_text).join("") : null;
    }
    case "rich_text": {
      const items = (p.rich_text as { plain_text: string }[]) ?? [];
      return items.length ? items.map((i) => i.plain_text).join("") : null;
    }
    case "url":
      return (p.url as string | null) ?? null;
    case "checkbox":
      return p.checkbox ? 1 : 0;
    case "formula":
      return readProp(p.formula as AnyProp);
    default:
      return null;
  }
}

function normalizePage(page: {
  id: string;
  properties: Record<string, AnyProp>;
}): NormalizedRow {
  const out: NormalizedRow = {
    id: page.id,
    Value: null,
    "Date Start": null,
    "Date End": null,
    Type: null,
    Category: null,
    Name: null,
    "Notion Url": null,
  };
  for (const [name, prop] of Object.entries(page.properties)) {
    out[name] = readProp(prop);
  }
  return out;
}

async function resolveDataSourceId(dbOrDataSourceId: string): Promise<string> {
  try {
    const db = await notion.databases.retrieve({
      database_id: dbOrDataSourceId,
    });
    if ("data_sources" in db && db.data_sources?.length) {
      return db.data_sources[0].id;
    }
  } catch {
    // fall through — input is likely already a data_source_id
  }
  return dbOrDataSourceId;
}

async function fetchAllRows(dbOrDataSourceId: string): Promise<NormalizedRow[]> {
  const dataSourceId = await resolveDataSourceId(dbOrDataSourceId);
  const rows: NormalizedRow[] = [];
  let cursor: string | undefined = undefined;
  do {
    const res = await notion.dataSources.query({
      data_source_id: dataSourceId,
      page_size: 100,
      start_cursor: cursor,
    });
    for (const page of res.results) {
      if ("properties" in page) {
        rows.push(
          normalizePage(page as { id: string; properties: Record<string, AnyProp> }),
        );
      }
    }
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return rows;
}

export function queryDatabase(dbId: string): Promise<NormalizedRow[]> {
  return unstable_cache(() => fetchAllRows(dbId), ["notion-db", dbId], {
    revalidate: 60,
    tags: [`notion-db:${dbId}`],
  })();
}
