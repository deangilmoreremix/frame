import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { db } from "../db.js";
import type { Project } from "@frame/common";

const body = z.object({ name: z.string().min(1).max(120) });

export const projectsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/projects", async () => [...db.projects.values()]);

  app.post("/projects", async (req) => {
    const { name } = body.parse(req.body);
    const now = new Date().toISOString();
    const project: Project = {
      id: uuid(),
      ownerId: "system",
      name,
      createdAt: now,
      updatedAt: now,
    };
    db.projects.set(project.id, project);
    return project;
  });

  app.get<{ Params: { id: string } }>("/projects/:id", async (req, reply) => {
    const project = db.projects.get(req.params.id);
    if (!project) return reply.code(404).send({ code: "not_found", message: "Project not found" });
    return project;
  });
};
