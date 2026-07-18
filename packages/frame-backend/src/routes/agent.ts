import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { store } from "../store.js";
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

    await store.createMessage({
      id: uuid(),
      projectId,
      role: "user",
      content: messages[messages.length - 1]!.content,
    });

    const replyText = await planFromAgent(projectId, messages as ChatMessage[]);

    const assistantMsg = await store.createMessage({
      id: uuid(),
      projectId,
      role: "assistant" as ChatRole,
      content: replyText,
    });

    return reply.send({ message: assistantMsg });
  });
};
