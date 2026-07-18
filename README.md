# Frame — AI-Powered Video Editing

Frame is an open-source, AI-powered video editor with a code-like creative flow:
import media, arrange clips on a timeline, and let the Frame Agent plan the cut.

> **Status:** This repository was originally a marketing skeleton (READMEs only).
> It now contains a runnable MVP: a Next.js web studio + a Fastify backend, with a
> shared TypeScript contract package. The backend persists to **Supabase** (Postgres +
> Storage) and the render pipeline is a stub (see "Production gaps").

## Architecture

```
packages/
  frame-common/   shared domain types (Project, MediaAsset, Clip, Timeline, RenderJob, ChatMessage)
  frame-backend/  Fastify API + AI agent; persistence via Supabase (Postgres + Storage)
  frame-web/      Next.js (App Router) studio UI: asset import, timeline, agent panel
supabase/
  schema.sql      tables (frame_* prefix) for Supabase Postgres
```

Data flow: Web UI → `@frame/web/src/lib/api.ts` → Backend REST (`/api/v1/...`)
→ Supabase (Postgres tables + Storage `frame-media` bucket) → (render stub) → export.

## Storage & database (Supabase)

The backend uses the **Supabase JS client** with the service role key (server-side only).
Tables are namespaced `frame_*` to avoid collisions with other apps in the same project:
`frame_projects`, `frame_assets`, `frame_tracks`, `frame_clips`, `frame_render_jobs`,
`frame_chat_messages`. Uploaded media is streamed to the `frame-media` Storage bucket.

### Shared-DB isolation

This Supabase project is **shared with other applications**, so isolation is enforced at
two layers:

1. **Naming isolation** — all our tables use a `frame_` prefix in the `public` schema.
   (The REST API only exposes `public`; a dedicated `frame` schema would require adding it
   in the dashboard's API settings, so we deliberately stay in `public`.)
2. **Row Level Security** — RLS is enabled on every `frame_*` table with a service-role
   policy, so the tables are protected from anon/authenticated access and from the other
   apps. Our backend uses the service role key, which bypasses RLS, so the API is unaffected.

Storage objects are isolated by the `frame/` object prefix (`assets/<projectId>/...`) in a
private `frame-media` bucket.

### Supabase CLI

The project uses the **Supabase CLI** (installed as a dev dependency) for schema migrations:

- `supabase/config.toml` — project config (`project_id = bzxohkrxcwodllketcpz`).
- `supabase/migrations/` — versioned SQL migrations:
  - `20240718000000_init.sql` — creates the `frame_*` tables/indexes.
  - `20240718020000_frame_tables_rls.sql` — (re)creates tables if missing + enables RLS/policies.
  - `20240718030000_frame_storage_policies.sql` — ensures the private `frame-media` bucket.

Commands (run via `pnpm`):
- `pnpm run db:push` — apply local migrations to the remote DB
  (`supabase db push --db-url "$SUPABASE_DB_URL"`). Used automatically in the Netlify build.
- `pnpm run db:diff -f <name>` — generate a new migration from local DB changes.
- `supabase link --project-ref bzxohkrxcwodllketcpz` — for linking (needs a personal access token).

> This Supabase project is shared with another app, so its pre-existing migrations were
> adopted as empty placeholder files (`*_adopted.sql`) to reconcile the migration history.

Setup:
1. `pnpm install` (installs the Supabase CLI).
2. Set env (see `packages/frame-backend/.env.example`): `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET`, and `SUPABASE_DB_URL` (Postgres
   connection string) for `db:push`.
3. `pnpm run db:push` to apply the schema (or let Netlify do it on deploy).

> The service role key bypasses RLS. When adding Supabase Auth, tighten the `frame_*` policies
> to scope by `auth.uid()` and add storage policies for the `frame/` prefix.

## Prerequisites

- Node >= 18 (`.node-version` pins v18)
- pnpm 8.x (`npm i -g pnpm@8.15.0`)

## Develop

```bash
pnpm install
pnpm --filter @frame/common run build     # build shared types first
pnpm dev                                    # runs web (3000) + backend (4000) in parallel
```

Web expects the backend at `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:4000`).

## Verify

```bash
pnpm -r run typecheck        # type-check all packages
pnpm --filter @frame/backend run test     # API smoke tests
pnpm --filter @frame/web run build        # production build of web
```

## Deploy (Netlify)

Both the web app and the API run on Netlify from this repo:

- **Web:** built by `@netlify/plugin-nextjs` (Next.js output in `packages/frame-web/.next`).
- **API:** a Netlify Function at `netlify/functions/api.ts` wraps the Fastify app via
  `app.inject`, so `/api/*` is served same-origin (no separate host, no CORS needed).

Deploy steps:
1. Connect the repo to Netlify and set the build command to `pnpm run build:netlify`
   (builds `@frame/common` + `@frame/backend` + `@frame/web`).
2. Add the function env vars (see `packages/frame-backend/.env.example`):
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET`,
   and optionally `FRAME_AI_PROVIDER` / `FRAME_AI_API_KEY`.
3. `NEXT_PUBLIC_API_URL` is set to `/api` in `netlify.toml`, so the browser calls the
   same-origin function.
4. `netlify.toml` redirects `/api/*` → `/.netlify/functions/api/:splat`.

> The function bundles the backend + `@frame/common` to `dist` (compiled by
> `build:netlify`) and includes them via `functions.included_files`.

Alternative (Vercel): `vercel.json` still exists and deploys the web to Vercel,
rewriting `/api/*` to a separately hosted backend.

## Production gaps (to reach true production)

1. **Render pipeline:** replace the render stub with an ffmpeg/cloud-GPU worker + job queue.
2. **Auth:** add real user auth (Supabase Auth); scope `ownerId` and enable RLS policies.
3. **AI provider:** set `FRAME_AI_PROVIDER` + `FRAME_AI_API_KEY`; implement `agent/agent.ts`.
4. **Media metadata:** probe uploads for real duration/width/height (e.g. ffprobe) instead of 0.
5. **CI/CD:** `.github/workflows/ci.yml` runs typecheck, backend tests, and web build.
6. **Client video engine:** wire a real player/encoder (e.g. ffmpeg.wasm / remotion) for previews.
