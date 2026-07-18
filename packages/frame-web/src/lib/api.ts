import type {
  ChatMessage,
  Clip,
  MediaAsset,
  Project,
  RenderJob,
  Timeline,
} from "@frame/common";

type RequestInit = globalThis.RequestInit;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  listProjects: () => request<Project[]>("/api/v1/projects"),
  createProject: (name: string) =>
    request<Project>("/api/v1/projects", { method: "POST", body: JSON.stringify({ name }) }),
  listAssets: (projectId: string) => request<MediaAsset[]>(`/api/v1/projects/${projectId}/assets`),
  uploadAsset: async (projectId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_URL}/api/v1/projects/${projectId}/assets`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw new Error("Upload failed");
    return (await res.json()) as MediaAsset;
  },
  getTimeline: (projectId: string) => request<Timeline>(`/api/v1/projects/${projectId}/timeline`),
  addClip: (projectId: string, clip: Omit<Clip, "id">) =>
    request<Clip>(`/api/v1/projects/${projectId}/clips`, {
      method: "POST",
      body: JSON.stringify(clip),
    }),
  render: (projectId: string) =>
    request<RenderJob>(`/api/v1/projects/${projectId}/render`, { method: "POST" }),
  getRender: (jobId: string) => request<RenderJob>(`/api/v1/render/${jobId}`),
  agent: (projectId: string, messages: ChatMessage[]) =>
    request<{ message: ChatMessage }>(`/api/v1/projects/${projectId}/agent`, {
      method: "POST",
      body: JSON.stringify({ messages }),
    }),
};
