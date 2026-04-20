# notion-graphs

Embeddable charts generated from Notion databases. A Next.js app deployable to Vercel that:

- Reads rows from one Notion database (per chart) via the official API
- Aggregates them (group + sum/count/avg) and renders pie / bar / line charts with Recharts
- Serves each chart at a signed `/embed/<token>` URL designed to be embedded in Notion
- Refreshes data via ISR (`revalidate=60s`)

## Setup

```bash
pnpm install
cp .env.local.example .env.local
# fill NOTION_TOKEN, EMBED_SECRET, NEXT_PUBLIC_BASE_URL
pnpm dev
```

Generate `EMBED_SECRET`:

```bash
openssl rand -hex 32
```

### Notion integration

1. Create an internal integration: <https://www.notion.so/my-integrations> → copy the `secret_...` token into `NOTION_TOKEN`.
2. Open each Notion database you want to chart → `...` menu → **Connections** → connect your integration.
3. Copy the database ID from the page URL: `https://www.notion.so/<workspace>/<DB-ID>?v=...` (32 hex chars).

## Build a chart

Open `http://localhost:3000/preview` and paste the database ID. Use the sidebar to:

- pick chart type (pie / bar / line)
- choose **Group by** and **Value** properties
- pick aggregation (sum / count / avg)
- toggle filters for `Type` / `Category`
- set an optional title

When you're happy, click **Generate embed URL**. The sidebar shows the signed URL and an iframe snippet you can copy.

### Embed in Notion

Paste the **URL** (not the `<iframe>` code — Notion strips iframe blocks) into a Notion page → **Create embed**. The page is iframe-friendly via `Content-Security-Policy: frame-ancestors *`.

> ⚠️ **Notion cannot load `http://localhost` URLs.** The embed runs in an iframe served from Notion's HTTPS domain, which blocks unreachable hosts and mixed content. Deploy to Vercel (or any HTTPS host) **before** pasting the link into Notion. For local iteration, use `/preview` in your own browser.

## Deploy

```bash
vercel
```

Add `NOTION_TOKEN`, `EMBED_SECRET`, and `NEXT_PUBLIC_BASE_URL` (set to your prod URL) in the Vercel dashboard. Then mint URLs against the prod host from `/preview`.

## How it works

```
Notion DB ─► dataSources.query (paginated, cached 60s)
         ─► normalize → applyFilters → groupAndAggregate
         ─► <ChartRenderer> (recharts, client component)
```

- `src/lib/notion.ts` — SDK client + property normalizer + `unstable_cache` wrapper.
- `src/lib/config.ts` — base64url + HMAC-SHA256 token codec.
- `src/lib/aggregate.ts` — filter + group-by + sum/count/avg.
- `src/app/embed/[config]/page.tsx` — server component, ISR `revalidate=60`.
- `src/app/preview/page.tsx` — interactive UI to pick filters and mint URLs.
- `src/app/actions.ts` — server action that signs configs into embed URLs.
- `src/components/{Pie,Bar,Line}Chart.tsx` — Recharts wrappers.

## Notes

- Notion API rate limit (~3 req/s) is respected because each `db` is cached for 60s; many concurrent loads of the same chart trigger one query.
- Anyone with the full URL can render the chart; tokens are only unguessable to prevent forging new ones without `EMBED_SECRET`. Don't use this for sensitive data.
