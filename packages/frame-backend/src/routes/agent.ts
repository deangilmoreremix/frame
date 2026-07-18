import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { db } from "../db.js";
import type { ChatMessage, ChatRole } from "@frame/common";
import { planFromAgent } from "../agent/agent.js";

const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});

const body = z.object({
  messages: z.array(messageSchema).min(1),
});

export const agentRoutes: FastifyPluginAsync = async (app) => {
  app.post("/projects/:id/agent", async (req, reply) => {
    const projectId = (req.params as { id: string }).id;
    const { messages } = body.parse(req.body);

    const userMsg: ChatMessage = {
      id: uuid(),
      projectId,
      role: "user",
      content: messages[messages.length - 1]!.content,
      createdAt: new Date().toISOString(),
    };
    db.chat.set(userMsg.id, userMsg);

    const replyText = await planFromAgent(projectId, messages as ChatMessage[]);

    const assistantMsg: ChatMessage = {
      id: uuid(),
      projectId,
      role: "assistant" as ChatRole,
      content: replyText,
      createdAt: new Date().toISOString(),
    };
    db.chat.set(assistantMsg.id, assistantMsg);

    return reply.send({ message: assistantMsg });
  });
};
