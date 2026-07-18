export * from "./types.js";

export const FRAME_API_VERSION = "v1";

export const DEFAULT_TRANSITION_DURATION = 0.5;
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024;
export const SUPPORTED_VIDEO_MIME = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-matroska",
] as const;
export const SUPPORTED_AUDIO_MIME = ["audio/mpeg", "audio/wav", "audio/mp4"] as const;
export const SUPPORTED_IMAGE_MIME = ["image/png", "image/jpeg", "image/webp"] as const;

export function isSupportedMedia(mime: string): boolean {
  return [...SUPPORTED_VIDEO_MIME, ...SUPPORTED_AUDIO_MIME, ...SUPPORTED_IMAGE_MIME].includes(
    mime as (typeof SUPPORTED_VIDEO_MIME)[number],
  );
}
