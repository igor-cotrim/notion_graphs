# notion-graphs

Embeddable charts generated from your Notion databases. Anyone connects their own Notion workspace, picks a database, and mints a signed `/embed/<token>` URL to paste back into Notion.

**Stack**: Next.js 16 (App Router, React 19) · Notion SDK v5 (OAuth) · Neon Postgres + Drizzle · Recharts · Tailwind v4.

## Features

- Per-user Notion OAuth — each visitor connects their own workspace
- Aggregate rows (group + sum/count/avg) and render pie / bar / line charts
- Filters for `Type` / `Category` properties with live preview
- Signed `/embed/<token>` URLs, iframe-friendly (`frame-ancestors *`)
- ISR (`revalidate=60s`) + per-user cache isolation

> **Before external users can connect**, your public integration needs Notion's review approval. Until then only workspaces you own can authorize the app. You can build and test everything else locally in the meantime.

## Setup

### 1. Clone & install

```bash
pnpm install
cp .env.local.example .env.local
```

### 2. Generate secrets

```bash
openssl rand -hex 32   # EMBED_SECRET
openssl rand -hex 32   # SESSION_SECRET
openssl rand -hex 32   # ENCRYPTION_KEY
```

Paste each into `.env.local`.

### 3. Create a Neon project

Sign up at [neon.tech](https://neon.tech), create a project, copy the pooled connection string into `DATABASE_URL`.

### 4. Create a Notion public integration

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations) → **New integration** → type **Public**.
2. Fill in company/site/privacy/ToS URLs (any public URL works during dev).
3. Under **Redirect URIs**, add `http://localhost:3000/api/auth/notion/callback` (and your prod URL once deployed).
4. Copy the OAuth **Client ID** and **Client secret** into `.env.local`.
5. Submit for review when you're ready to open it up.

Your `.env.local` should now look like:

```
NOTION_CLIENT_ID=...
NOTION_CLIENT_SECRET=...
DATABASE_URL=postgres://...
EMBED_SECRET=...
SESSION_SECRET=...
ENCRYPTION_KEY=...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 5. Apply the DB schema

```bash
pnpm db:push
```

### 6. Run

```bash
pnpm dev
```

Open <http://localhost:3000> → **Connect Notion** → authorize → you'll land on `/preview`.

## Build a chart

In `/preview`, paste a Notion database ID (32 hex chars from `notion.so/<workspace>/<DB-ID>?v=...`). In the sidebar:

- pick chart type (pie / bar / line)
- choose **Group by** and **Value** properties
- pick aggregation (sum / count / avg)
- toggle filters for `Type` / `Category`
- set an optional title

Click **Generate embed URL** — the sidebar shows the signed URL and an iframe snippet you can copy.

> The database must be shared with your integration. In Notion: open the DB → `...` → **Connections** → add the integration you created.

### Embed in Notion

Paste the **URL** (not the `<iframe>` — Notion strips iframe blocks) into a Notion page → **Create embed**.

> ⚠️ **Notion can't iframe `http://localhost`.** Their embed runs on HTTPS and blocks mixed content. For local iteration, open `/preview` directly; only paste into Notion after deploying.

## Deploy

```bash
vercel
```

In Vercel's dashboard:
1. Add every variable from `.env.local.example`.
2. Set `NEXT_PUBLIC_BASE_URL` to your production origin.
3. Add `https://<prod-host>/api/auth/notion/callback` as a redirect URI on the Notion integration.
4. Run `pnpm db:push` against the production `DATABASE_URL` (or use `pnpm db:generate` + `pnpm db:migrate` for a migration-based flow).

## Commands

| | |
|---|---|
| `pnpm dev` | Next dev server on :3000 |
| `pnpm build` / `pnpm start` | Production build + serve |
| `pnpm lint` | ESLint |
| `pnpm db:push` | Apply schema to `DATABASE_URL` (dev) |
| `pnpm db:generate` / `pnpm db:migrate` | Migration-based flow (prod) |
| `pnpm db:studio` | Drizzle Studio UI |

## How it works

```
Connect Notion (OAuth)  ─► users table (access token AES-256-GCM encrypted)
Signed session cookie   ─► requireUser() in server components
queryDatabase(userId,…) ─► unstable_cache (60s, keyed per user)
                        ─► applyFilters → groupAndAggregate
                        ─► <ChartRenderer>   (Pie | Bar | Line)
```

For the full architecture — file-by-file responsibilities, cache-isolation invariants, and the embed-token codec — see [`CLAUDE.md`](./CLAUDE.md).

## Security notes

- Notion tokens are AES-256-GCM encrypted at rest. Losing `ENCRYPTION_KEY` bricks every stored credential; rotating it requires a re-encrypt migration.
- Embed URLs are unguessable but not private — anyone with the full URL can render the chart. The HMAC only prevents forging new URLs without `EMBED_SECRET`. **Don't embed sensitive data.**
- Rotating `EMBED_SECRET` invalidates every previously minted embed URL.
- Notion API rate limit (~3 req/s) is **per integration**, shared across all connected workspaces. The 60s `unstable_cache` is the main mitigation.
