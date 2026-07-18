import { supabase } from "./supabase.js";
import type {
  ChatMessage,
  Clip,
  MediaAsset,
  Project,
  RenderJob,
  Timeline,
  Track,
  UUID,
} from "@frame/common";

interface ProjectRow {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}
interface AssetRow {
  id: string;
  project_id: string;
  kind: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  duration_seconds: number;
  width: number;
  height: number;
  storage_key: string;
  created_at: string;
}
interface TrackRow {
  id: string;
  project_id: string;
  kind: string;
  name: string;
  index: number;
}
interface ClipRow {
  id: string;
  track_id: string;
  asset_id: string;
  start_seconds: number;
  end_seconds: number;
  in_point_seconds: number;
  out_point_seconds: number;
  transition: string;
  transition_duration_seconds: number;
}
interface RenderRow {
  id: string;
  project_id: string;
  status: string;
  output_storage_key: string | null;
  progress: number;
  created_at: string;
  finished_at: string | null;
  error: string | null;
}
interface ChatRow {
  id: string;
  project_id: string;
  role: string;
  content: string;
  created_at: string;
}

function toProject(r: ProjectRow): Project {
  return { id: r.id, ownerId: r.owner_id, name: r.name, createdAt: r.created_at, updatedAt: r.updated_at };
}
function toAsset(r: AssetRow): MediaAsset {
  return {
    id: r.id,
    projectId: r.project_id,
    kind: r.kind as MediaAsset["kind"],
    fileName: r.file_name,
    mimeType: r.mime_type,
    sizeBytes: r.size_bytes,
    durationSeconds: r.duration_seconds,
    width: r.width,
    height: r.height,
    storageKey: r.storage_key,
    createdAt: r.created_at,
  };
}
function toTrack(r: TrackRow): Track {
  return { id: r.id, projectId: r.project_id, kind: r.kind as Track["kind"], name: r.name, index: r.index };
}
function toClip(r: ClipRow): Clip {
  return {
    id: r.id,
    trackId: r.track_id,
    assetId: r.asset_id,
    startSeconds: r.start_seconds,
    endSeconds: r.end_seconds,
    inPointSeconds: r.in_point_seconds,
    outPointSeconds: r.out_point_seconds,
    transition: r.transition as Clip["transition"],
    transitionDurationSeconds: r.transition_duration_seconds,
  };
}
function toRender(r: RenderRow): RenderJob {
  return {
    id: r.id,
    projectId: r.project_id,
    status: r.status as RenderJob["status"],
    outputStorageKey: r.output_storage_key,
    progress: r.progress,
    createdAt: r.created_at,
    finishedAt: r.finished_at,
    error: r.error,
  };
}
function toChat(r: ChatRow): ChatMessage {
  return { id: r.id, projectId: r.project_id, role: r.role as ChatMessage["role"], content: r.content, createdAt: r.created_at };
}

export const store = {
  async listProjects(): Promise<Project[]> {
    const { data, error } = await supabase.from("frame_projects").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data as ProjectRow[]).map(toProject);
  },
  async createProject(name: string, ownerId = "system"): Promise<Project> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("frame_projects")
      .insert({ name, owner_id: ownerId, created_at: now, updated_at: now })
      .select()
      .single();
    if (error) throw error;
    return toProject(data as ProjectRow);
  },
  async getProject(id: UUID): Promise<Project | null> {
    const { data, error } = await supabase.from("frame_projects").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? toProject(data as ProjectRow) : null;
  },

  async listAssets(projectId: UUID): Promise<MediaAsset[]> {
    const { data, error } = await supabase.from("frame_assets").select("*").eq("project_id", projectId).order("created_at");
    if (error) throw error;
    return (data as AssetRow[]).map(toAsset);
  },
  async createAsset(a: Omit<MediaAsset, "createdAt">): Promise<MediaAsset> {
    const row: AssetRow = {
      id: a.id,
      project_id: a.projectId,
      kind: a.kind,
      file_name: a.fileName,
      mime_type: a.mimeType,
      size_bytes: a.sizeBytes,
      duration_seconds: a.durationSeconds,
      width: a.width,
      height: a.height,
      storage_key: a.storageKey,
      created_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from("frame_assets").insert(row).select().single();
    if (error) throw error;
    return toAsset(data as AssetRow);
  },
  async getAsset(id: UUID): Promise<MediaAsset | null> {
    const { data, error } = await supabase.from("frame_assets").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? toAsset(data as AssetRow) : null;
  },

  async createTrack(t: Omit<Track, "index">): Promise<Track> {
    const { count } = await supabase.from("frame_tracks").select("*", { count: "exact", head: true }).eq("project_id", t.projectId);
    const row: TrackRow = { id: t.id, project_id: t.projectId, kind: t.kind, name: t.name, index: count ?? 0 };
    const { data, error } = await supabase.from("frame_tracks").insert(row).select().single();
    if (error) throw error;
    return toTrack(data as TrackRow);
  },
  async getTrack(id: UUID): Promise<Track | null> {
    const { data, error } = await supabase.from("frame_tracks").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? toTrack(data as TrackRow) : null;
  },

  async createClip(c: Clip): Promise<Clip> {
    const row: ClipRow = {
      id: c.id,
      track_id: c.trackId,
      asset_id: c.assetId,
      start_seconds: c.startSeconds,
      end_seconds: c.endSeconds,
      in_point_seconds: c.inPointSeconds,
      out_point_seconds: c.outPointSeconds,
      transition: c.transition,
      transition_duration_seconds: c.transitionDurationSeconds,
    };
    const { data, error } = await supabase.from("frame_clips").insert(row).select().single();
    if (error) throw error;
    return toClip(data as ClipRow);
  },
  async deleteClip(id: UUID): Promise<boolean> {
    const { error } = await supabase.from("frame_clips").delete().eq("id", id);
    return !error;
  },

  async createRender(r: Omit<RenderJob, "createdAt">): Promise<RenderJob> {
    const row: RenderRow = {
      id: r.id,
      project_id: r.projectId,
      status: r.status,
      output_storage_key: r.outputStorageKey,
      progress: r.progress,
      created_at: new Date().toISOString(),
      finished_at: r.finishedAt,
      error: r.error,
    };
    const { data, error } = await supabase.from("frame_render_jobs").insert(row).select().single();
    if (error) throw error;
    return toRender(data as RenderRow);
  },
  async getRender(id: UUID): Promise<RenderJob | null> {
    const { data, error } = await supabase.from("frame_render_jobs").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? toRender(data as RenderRow) : null;
  },

  async createMessage(m: Omit<ChatMessage, "createdAt">): Promise<ChatMessage> {
    const row: ChatRow = {
      id: m.id,
      project_id: m.projectId,
      role: m.role,
      content: m.content,
      created_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from("frame_chat_messages").insert(row).select().single();
    if (error) throw error;
    return toChat(data as ChatRow);
  },
};

export async function getTimeline(projectId: UUID): Promise<Timeline> {
  const { data: tracksData, error: te } = await supabase.from("frame_tracks").select("*").eq("project_id", projectId);
  if (te) throw te;
  const tracks = (tracksData as TrackRow[]).map(toTrack);
  const trackIds = tracks.map((t) => t.id);
  let clips: Clip[] = [];
  if (trackIds.length) {
    const { data: clipsData, error: ce } = await supabase
      .from("frame_clips")
      .select("*")
      .in("track_id", trackIds);
    if (ce) throw ce;
    clips = (clipsData as ClipRow[]).map(toClip);
  }
  const durationSeconds = clips.reduce((max, c) => Math.max(max, c.endSeconds), 0);
  return { projectId, tracks, clips, durationSeconds };
}
