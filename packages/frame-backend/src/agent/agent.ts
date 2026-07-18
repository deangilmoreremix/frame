import type { ChatMessage } from "@frame/common";

interface AgentPlan {
  summary: string;
  actions: string[];
}

// Pluggable AI integration. Production sets FRAME_AI_PROVIDER and an API key;
// otherwise a deterministic mock plan keeps the backend runnable offline.
export async function planFromAgent(
  _projectId: string,
  messages: ChatMessage[],
): Promise<string> {
  const last = messages[messages.length - 1]?.content ?? "";
  const provider = process.env.FRAME_AI_PROVIDER;
  const apiKey = process.env.FRAME_AI_API_KEY;

  if (provider && apiKey) {
    return callProvider(provider, apiKey, messages);
  }

  const plan: AgentPlan = {
    summary: `I analyzed your request: "${last.slice(0, 80)}".`,
    actions: [
      "Import your source clips into the project.",
      "Auto-detect scene cuts and place clips on the timeline.",
      "Apply a cross-dissolve between scenes.",
      "Export at 1080p.",
    ],
  };
  return JSON.stringify(plan);
}

async function callProvider(provider: string, apiKey: string, messages: ChatMessage[]): Promise<string> {
  // NOTE: replace with the real provider SDK (OpenAI/Anthropic/open model).
  // Kept minimal so the contract is stable; integration is a follow-up step.
  const url = provider === "anthropic" ? "https://api.anthropic.com/v1/messages" : "https://api.openai.com/v1/chat/completions";
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ messages, model: "gpt-4o-mini" }),
  });
  if (!res.ok) return JSON.stringify({ summary: "AI call failed", actions: [] });
  const data = (await res.json()) as { choices?: { message: { content: string } }[] };
  return data.choices?.[0]?.message?.content ?? JSON.stringify({ summary: "No response", actions: [] });
}
