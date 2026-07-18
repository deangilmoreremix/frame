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

Setup:
1. `supabase/schema.sql` creates the tables/indexes (run in the Supabase SQL editor).
2. Create the Storage bucket `frame-media` (private).
3. Set env (see `packages/frame-backend/.env.example`): `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET`.

> The service role key bypasses RLS. Before exposing a browser client, enable RLS and
> add policies scoped to `auth.uid()`.

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

## Deploy

- **Web:** `vercel.json` builds `@frame/web` and rewrites `/api/*` to the backend.
- **Backend:** `packages/frame-backend/Dockerfile` (Node 18, production server on :4000).

## Production gaps (to reach true production)

1. **Render pipeline:** replace the render stub with an ffmpeg/cloud-GPU worker + job queue.
2. **Auth:** add real user auth (Supabase Auth); scope `ownerId` and enable RLS policies.
3. **AI provider:** set `FRAME_AI_PROVIDER` + `FRAME_AI_API_KEY`; implement `agent/agent.ts`.
4. **Media metadata:** probe uploads for real duration/width/height (e.g. ffprobe) instead of 0.
5. **CI/CD:** `.github/workflows/ci.yml` runs typecheck, backend tests, and web build.
6. **Client video engine:** wire a real player/encoder (e.g. ffmpeg.wasm / remotion) for previews.
