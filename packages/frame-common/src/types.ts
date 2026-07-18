export type UUID = string;
export type ISO8601 = string;

export interface User {
  id: UUID;
  email: string;
  displayName: string;
  createdAt: ISO8601;
}

export interface Project {
  id: UUID;
  ownerId: UUID;
  name: string;
  createdAt: ISO8601;
  updatedAt: ISO8601;
}

export type MediaAssetKind = "video" | "audio" | "image";

export interface MediaAsset {
  id: UUID;
  projectId: UUID;
  kind: MediaAssetKind;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number;
  width: number;
  height: number;
  storageKey: string;
  createdAt: ISO8601;
}

export type TrackKind = "video" | "audio";

export interface Track {
  id: UUID;
  projectId: UUID;
  kind: TrackKind;
  name: string;
  index: number;
}

export type ClipTransition = "none" | "fade" | "dissolve" | "slide";

export interface Clip {
  id: UUID;
  trackId: UUID;
  assetId: UUID;
  startSeconds: number;
  endSeconds: number;
  inPointSeconds: number;
  outPointSeconds: number;
  transition: ClipTransition;
  transitionDurationSeconds: number;
}

export interface Timeline {
  projectId: UUID;
  tracks: Track[];
  clips: Clip[];
  durationSeconds: number;
}

export type RenderStatus = "queued" | "processing" | "ready" | "failed";

export interface RenderJob {
  id: UUID;
  projectId: UUID;
  status: RenderStatus;
  outputStorageKey: string | null;
  progress: number;
  createdAt: ISO8601;
  finishedAt: ISO8601 | null;
  error: string | null;
}

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: UUID;
  projectId: UUID;
  role: ChatRole;
  content: string;
  createdAt: ISO8601;
}

export interface ApiError {
  code: string;
  message: string;
}
