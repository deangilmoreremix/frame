-- Frame schema for Supabase (Postgres). Run in the Supabase SQL editor or via migrations.
-- Tables are namespaced with a `frame_` prefix to avoid colliding with other apps
-- sharing this Supabase project (e.g. an existing `projects`/`chat_messages` table).
-- Maps 1:1 to packages/frame-common domain types.

create extension if not exists "uuid-ossp";

create table if not exists public.frame_projects (
  id uuid primary key default uuid_generate_v4(),
  owner_id text not null default 'system',
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.frame_assets (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.frame_projects(id) on delete cascade,
  kind text not null check (kind in ('video','audio','image')),
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  duration_seconds double precision not null default 0,
  width integer not null default 0,
  height integer not null default 0,
  storage_key text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.frame_tracks (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.frame_projects(id) on delete cascade,
  kind text not null check (kind in ('video','audio')),
  name text not null,
  index integer not null default 0
);

create table if not exists public.frame_clips (
  id uuid primary key default uuid_generate_v4(),
  track_id uuid not null references public.frame_tracks(id) on delete cascade,
  asset_id uuid not null references public.frame_assets(id) on delete cascade,
  start_seconds double precision not null default 0,
  end_seconds double precision not null default 0,
  in_point_seconds double precision not null default 0,
  out_point_seconds double precision not null default 0,
  transition text not null default 'none' check (transition in ('none','fade','dissolve','slide')),
  transition_duration_seconds double precision not null default 0
);

create table if not exists public.frame_render_jobs (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.frame_projects(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued','processing','ready','failed')),
  output_storage_key text,
  progress double precision not null default 0,
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  error text
);

create table if not exists public.frame_chat_messages (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.frame_projects(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_frame_assets_project on public.frame_assets(project_id);
create index if not exists idx_frame_tracks_project on public.frame_tracks(project_id);
create index if not exists idx_frame_clips_track on public.frame_clips(track_id);
create index if not exists idx_frame_chat_project on public.frame_chat_messages(project_id);

-- The backend uses the service role key (bypasses RLS). For browser clients,
-- enable RLS and add policies scoped to auth.uid() before exposing anon access.
