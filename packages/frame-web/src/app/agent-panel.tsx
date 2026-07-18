"use client";

import { useState } from "react";
import { api } from "../lib/api";
import type { ChatMessage, Project } from "@frame/common";

interface Props {
  project: Project | null;
  onTimelineChange: (p: Project) => void;
}

export default function AgentPanel({ project, onTimelineChange }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!project || !input.trim() || busy) return;
    const next: ChatMessage[] = [
      ...messages,
      { id: "tmp", projectId: project.id, role: "user", content: input, createdAt: new Date().toISOString() },
    ];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const { message } = await api.agent(project.id, next);
      setMessages((m) => [...m, message]);
      await onTimelineChange(project);
    } catch {
      setMessages((m) => [...m, { id: "err", projectId: project.id, role: "assistant", content: "Agent error.", createdAt: new Date().toISOString() }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside style={{ borderLeft: "1px solid #222", padding: 12, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <h4>Frame Agent</h4>
      <div style={{ flex: 1, overflowY: "auto", fontSize: 13 }}>
        {messages.map((m) => (
          <div key={m.id} style={{ marginBottom: 8, textAlign: m.role === "user" ? "right" : "left" }}>
            <span style={{ display: "inline-block", background: m.role === "user" ? "#2b6cff" : "#222", padding: "6px 10px", borderRadius: 8, maxWidth: "90%" }}>
              {m.content}
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask the agent to cut your video…"
          style={{ flex: 1, padding: 8 }}
          disabled={busy}
        />
        <button onClick={send} disabled={busy || !project}>Send</button>
      </div>
    </aside>
  );
}
