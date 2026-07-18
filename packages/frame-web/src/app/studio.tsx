"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";
import type { ChatMessage, Clip, MediaAsset, Project, RenderJob, Timeline } from "@frame/common";
import AgentPanel from "./agent-panel";

export default function Studio() {
  const [project, setProject] = useState<Project | null>(null);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [render, setRender] = useState<RenderJob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (p: Project) => {
    setProject(p);
    const [a, t] = await Promise.all([api.listAssets(p.id), api.getTimeline(p.id)]);
    setAssets(a);
    setTimeline(t);
  }, []);

  useEffect(() => {
    api
      .listProjects()
      .then((ps) => (ps.length ? load(ps[0]!) : api.createProject("Untitled").then(load)))
      .catch((e) => setError(String(e)));
  }, [load]);

  async function onUpload(file: File) {
    if (!project) return;
    setBusy(true);
    try {
      await api.uploadAsset(project.id, file);
      setAssets(await api.listAssets(project.id));
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function addClip(asset: MediaAsset) {
    if (!project || !timeline) return;
    const videoTrack = timeline.tracks.find((t) => t.kind === "video");
    if (!videoTrack) {
      setError("No video track. Add one via the agent or create a track.");
      return;
    }
    const start = timeline.durationSeconds;
    const clip: Omit<Clip, "id"> = {
      trackId: videoTrack.id,
      assetId: asset.id,
      startSeconds: start,
      endSeconds: start + Math.max(asset.durationSeconds, 5),
      inPointSeconds: 0,
      outPointSeconds: Math.max(asset.durationSeconds, 5),
      transition: "none",
      transitionDurationSeconds: 0,
    };
    await api.addClip(project.id, clip);
    setTimeline(await api.getTimeline(project.id));
  }

  async function onRender() {
    if (!project) return;
    setBusy(true);
    try {
      const job = await api.render(project.id);
      setRender(job);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ display: "grid", gridTemplateRows: "auto 1fr auto", height: "100vh" }}>
      <header style={{ padding: "12px 20px", borderBottom: "1px solid #222", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>Frame Studio</strong>
        <span style={{ color: "#888" }}>{project?.name ?? "No project"}</span>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "240px 1fr 320px", minHeight: 0 }}>
        <aside style={{ borderRight: "1px solid #222", padding: 12, overflowY: "auto" }}>
          <h4>Assets</h4>
          <input type="file" accept="video/*,audio/*,image/*" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} disabled={busy} />
          <ul style={{ listStyle: "none", padding: 0 }}>
            {assets.map((a) => (
              <li key={a.id} style={{ padding: "6px 0", borderBottom: "1px solid #1a1a1a" }}>
                <div style={{ fontSize: 12 }}>{a.fileName}</div>
                <button onClick={() => addClip(a)} disabled={busy} style={{ marginTop: 4 }}>
                  + Add to timeline
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div style={{ padding: 16, overflowY: "auto" }}>
          <h4>Timeline</h4>
          {timeline?.tracks.map((t) => (
            <div key={t.id} style={{ border: "1px solid #222", marginBottom: 8, padding: 8 }}>
              <div style={{ fontSize: 12, color: "#888" }}>{t.name} ({t.kind})</div>
              <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                {timeline.clips
                  .filter((c) => c.trackId === t.id)
                  .map((c) => (
                    <div key={c.id} style={{ background: "#2b6cff", color: "#fff", padding: "4px 8px", borderRadius: 4, fontSize: 12 }}>
                      {c.startSeconds.toFixed(1)}–{c.endSeconds.toFixed(1)}s
                    </div>
                  ))}
              </div>
            </div>
          ))}
          <button onClick={onRender} disabled={busy || !timeline?.clips.length} style={{ marginTop: 12 }}>
            {busy ? "Working…" : "Export / Render"}
          </button>
          {render && <div style={{ marginTop: 8, fontSize: 12, color: "#888" }}>Render: {render.status} ({render.progress}%)</div>}
        </div>

        <AgentPanel project={project} onTimelineChange={load} />
      </section>

      {error && (
        <footer style={{ padding: "8px 20px", background: "#3a0d0d", color: "#f88", fontSize: 12 }}>{error}</footer>
      )}
    </main>
  );
}
