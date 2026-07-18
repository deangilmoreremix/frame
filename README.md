# Frame — AI-Powered Video Editing

Frame is an open-source, AI-powered video editor with a code-like creative flow:
import media, arrange clips on a timeline, and let the Frame Agent plan the cut.

> **Status:** This repository was originally a marketing skeleton (READMEs only).
> It now contains a runnable MVP: a Next.js web studio + a Fastify backend, with a
> shared TypeScript contract package. Storage and the render pipeline use in-memory
> stubs that are marked for replacement with real infra (see "Production gaps").

## Architecture

```
packages/
  frame-common/   shared domain types (Project, MediaAsset, Clip, Timeline, RenderJob, ChatMessage)
  frame-backend/  Fastify API + AI agent (in-memory store; pluggable model provider)
  frame-web/      Next.js (App Router) studio UI: asset import, timeline, agent panel
```

Data flow: Web UI → `@frame/web/src/lib/api.ts` → Backend REST (`/api/v1/...`)
→ in-memory store → (render stub) → export.

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

1. **Persistence:** swap `frame-backend/src/db.ts` in-memory maps for Postgres + migrations.
2. **Storage:** stream uploaded files (`assets.ts`) to S3/R2; serve via signed URLs.
3. **Render pipeline:** replace the render stub with an ffmpeg/cloud-GPU worker + job queue.
4. **Auth:** add real user auth; replace `ownerId: "system"`.
5. **AI provider:** set `FRAME_AI_PROVIDER` + `FRAME_AI_API_KEY`; implement `agent/agent.ts`.
6. **CI/CD:** `.github/workflows/ci.yml` runs typecheck, backend tests, and web build.
7. **Client video engine:** wire a real player/encoder (e.g. ffmpeg.wasm / remotion) for previews.
