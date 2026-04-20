# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `pnpm dev` — start Next.js dev server on :3000
- `pnpm build` / `pnpm start` — production build + serve
- `pnpm lint` — run ESLint (flat config, extends `next/core-web-vitals` + `next/typescript`)
- `pnpm db:push` — apply the Drizzle schema to `DATABASE_URL` (dev)
- `pnpm db:generate` / `pnpm db:migrate` — generate and run migrations (prod)
- `pnpm db:studio` — Drizzle Studio against the current DB

No test runner is configured. Package manager is pnpm (see `pnpm-workspace.yaml`).

## Required environment

`.env.local` must set:

- `NOTION_CLIENT_ID` / `NOTION_CLIENT_SECRET` — public integration credentials from [notion.so/my-integrations](https://www.notion.so/my-integrations). The integration's redirect URI must include `${NEXT_PUBLIC_BASE_URL}/api/auth/notion/callback`.
- `DATABASE_URL` — Neon Postgres connection string.
- `EMBED_SECRET` — HMAC key for signed `/embed/<token>` URLs.
- `SESSION_SECRET` — HMAC key for the `__session` auth cookie.
- `ENCRYPTION_KEY` — 32-byte hex key (AES-256-GCM) that encrypts each user's Notion access token at rest in Postgres.
- `NEXT_PUBLIC_BASE_URL` — origin used to build OAuth redirect URIs and minted embed URLs.

Each signing/encryption key: `openssl rand -hex 32`. There is no `NOTION_TOKEN` — tokens are per-user, acquired via OAuth.

## Architecture

Next.js App Router (React 19, Tailwind v4, `@notionhq/client` v5, Recharts v3, Drizzle + `@neondatabase/serverless`). Multi-tenant: each visitor connects their own Notion workspace via OAuth, and every embed is tied to its owner's stored token.

### Surfaces

1. **`/`** (`src/app/page.tsx`) — server component. Shows "Connect Notion" (→ `/api/auth/notion`) or "Open preview" + "Sign out" depending on session.
2. **`/preview`** (`src/app/preview/page.tsx`) — server component, `force-dynamic`. Gated by `requireUser()`; redirects to `/` when unauthenticated. Renders `PreviewForm` sidebar + `ChartRenderer` using the authed user's Notion token.
3. **`/embed/[config]`** (`src/app/embed/[config]/page.tsx`) — public embed target. Decodes the signed token, uses `config.userId` to look up the owner's Notion token, re-queries the DB, and renders the chart. `revalidate = 60` (ISR). Response sets `Content-Security-Policy: frame-ancestors *` via `next.config.ts`. If the owner is gone or their token is invalid, renders an "owner disconnected" message.

### Auth & OAuth

- `GET /api/auth/notion` (`src/app/api/auth/notion/route.ts`) — issues a CSRF `state`, sets it in a short-lived HTTP-only cookie, and redirects to Notion's authorize URL.
- `GET /api/auth/notion/callback` — validates `state`, exchanges the code via `notion.oauth.token(...)` (SDK v5's native helper), upserts a row in `users` keyed by `bot_id` with the access/refresh tokens encrypted, and calls `createSession(bot_id)`.
- `POST /api/auth/logout` — `clearSession()` + redirect home.
- **Session cookie**: `__session`, HTTP-only, HMAC-SHA256 signed with `SESSION_SECRET` (same codec pattern as `src/lib/config.ts`). Helpers in `src/lib/session.ts`.
- `src/lib/auth.ts` — `getCurrentUser()` (React-cached) reads the cookie → fetches the user row. `requireUser()` redirects to `/` if not signed in.

### Data pipeline

`Notion DB → getNotionClientForUser(userId) → queryDatabase(userId, dbId) → applyFilters → groupAndAggregate → ChartRenderer`

- **`src/lib/notionClient.ts`** — `getNotionClientForUser(userId)` (React-cached) reads the user row, `decrypt`s the access token, and returns a fresh `new Client({ auth })`. There is no module-level singleton client anymore.
- **`src/lib/notion.ts`** — `queryDatabase(userId, dbId)` wraps the fetch in `unstable_cache` keyed by `["notion-db", userId, dbId]` with tag `notion-db:${userId}:${dbId}`. **The userId must be in both the key and the tag — otherwise a DB cached for one user could be served to another.** `resolveDataSourceId` still handles the SDK v5 `databases → dataSources` indirection.
- **`src/lib/aggregate.ts`** — unchanged. AND across filter props, OR within each prop's list. `sum` / `count` / `avg`, sorted desc, rounded 2dp.
- **`src/lib/config.ts`** — base64url(JSON) + `.` + base64url(HMAC-SHA256 first 16 bytes), signed with `EMBED_SECRET`. `decodeConfig` now also requires `userId`.
- **`src/lib/types.ts`** — `EmbedConfig.userId: string` is **required**. Embeds carry the owner's id in plaintext inside the signed payload; only the HMAC prevents forging new ones.

### Persistence

- **`src/lib/db/schema.ts`** — single `users` table, PK = Notion `bot_id`. Stores workspace metadata + AES-256-GCM encrypted access/refresh tokens.
- **`src/lib/db/client.ts`** — `drizzle(neon(DATABASE_URL))` singleton.
- **`src/lib/crypto.ts`** — `encrypt`/`decrypt` using `aes-256-gcm`; packed format `base64(iv‖tag‖ciphertext)`.

### Client state

`PreviewForm` mirrors form state into the URL via `router.push` inside `useTransition`, re-triggering the server render. Each URL push also writes to `localStorage` (`notion-graphs:dbs`, see `src/lib/savedDbs.ts`) so `DatabaseTabs` persists the list of saved DBs per-browser. Per-browser is fine — the same user on two devices rebuilds their list, and `localStorage` never contains anything sensitive.

### Charts

`ChartRenderer` picks `PieChart` / `BarChart` / `LineChart` (all in `src/components/`) — thin Recharts wrappers sharing `ChartTooltip` and `palette.ts`. `src/lib/format.ts` has the number/percent/total helpers used by tooltips.

## Gotchas

- **Cache isolation** is the biggest risk. `queryDatabase`'s cache key and tag must include `userId`. Don't "simplify" back to `["notion-db", dbId]` — two users with the same `dbId` would share cached rows.
- **Next.js version**: see `AGENTS.md` — this is Next 16.2. Consult `node_modules/next/dist/docs/` for App Router APIs. Cache invalidation uses `updateTag` from `next/cache` (see `src/app/actions.ts`).
- **`dataSources` vs `databases`**: Notion SDK v5 splits these. `queryDatabase` handles the resolution; don't call `databases.query` directly.
- **Notion rate limit (~3 req/s)** is **per integration**, not per user. All authorized workspaces share the quota on the single public integration. Per-user `unstable_cache` (60s) is the main mitigation today.
- **Public integration review**: before Notion approves the integration, only the developer's own workspaces can authorize. Unreviewed users get an "integration not found" error. Plan accordingly.
- **Token encryption**: Notion tokens at rest are AES-256-GCM encrypted with `ENCRYPTION_KEY`. Losing that key bricks every stored token; rotating it requires a re-encrypt migration.
- **`EMBED_SECRET` rotation** invalidates every previously minted embed URL. Don't rotate without a migration plan.
- **Notion can't iframe `localhost`**. For local iteration open `/preview` directly; deploy before pasting embed URLs into Notion.
- **`force-dynamic` on `/preview` vs `revalidate = 60` on `/embed`**: intentional — preview is interactive, embed is cached. Keep ISR on any new `embed/` route or the Notion rate limit will bite.
