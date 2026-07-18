import {
  type ChatMessage,
  type Clip,
  type MediaAsset,
  type Project,
  type RenderJob,
  type Timeline,
  type Track,
  type UUID,
  type User,
} from "@frame/common";

interface Db {
  users: Map<UUID, User>;
  projects: Map<UUID, Project>;
  assets: Map<UUID, MediaAsset>;
  tracks: Map<UUID, Track>;
  clips: Map<UUID, Clip>;
  renderJobs: Map<UUID, RenderJob>;
  chat: Map<UUID, ChatMessage>;
}

// NOTE: In production this is replaced by Postgres + S3/R2.
// The shape mirrors the persisted schema so migration is mechanical.
function createDb(): Db {
  return {
    users: new Map(),
    projects: new Map(),
    assets: new Map(),
    tracks: new Map(),
    clips: new Map(),
    renderJobs: new Map(),
    chat: new Map(),
  };
}

export const db: Db = createDb();

export function getTimeline(projectId: UUID): Timeline {
  const tracks = [...db.tracks.values()].filter((t) => t.projectId === projectId);
  const clips = [...db.clips.values()].filter((c) =>
    tracks.some((t) => t.id === c.trackId),
  );
  const durationSeconds = clips.reduce((max, c) => Math.max(max, c.endSeconds), 0);
  return { projectId, tracks, clips, durationSeconds };
}
