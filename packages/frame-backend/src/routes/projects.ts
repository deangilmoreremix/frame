import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { store } from "../store.js";

const body = z.object({ name: z.string().min(1).max(120) });

export const projectsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/projects", async () => store.listProjects());

  app.post("/projects", async (req) => {
    const { name } = body.parse(req.body);
    return store.createProject(name, "system");
  });

  app.get<{ Params: { id: string } }>("/projects/:id", async (req, reply) => {
    const project = await store.getProject(req.params.id);
    if (!project) return reply.code(404).send({ code: "not_found", message: "Project not found" });
    return project;
  });
};
