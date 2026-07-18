import type { FastifyPluginAsync } from "fastify";
import { v4 as uuid } from "uuid";
import { db, getTimeline } from "../db.js";
import type { RenderJob } from "@frame/common";

export const renderRoutes: FastifyPluginAsync = async (app) => {
  app.post("/projects/:id/render", async (req, reply) => {
    const projectId = (req.params as { id: string }).id;
    const timeline = getTimeline(projectId);
    if (timeline.clips.length === 0) {
      return reply
        .code(400)
        .send({ code: "empty_timeline", message: "Nothing to render" });
    }
    const job: RenderJob = {
      id: uuid(),
      projectId,
      status: "queued",
      outputStorageKey: null,
      progress: 0,
      createdAt: new Date().toISOString(),
      finishedAt: null,
      error: null,
    };
    db.renderJobs.set(job.id, job);
    // NOTE: production enqueues a render worker (ffmpeg/cloud GPU) here.
    return reply.code(202).send(job);
  });

  app.get("/render/:jobId", async (req, reply) => {
    const job = db.renderJobs.get((req.params as { jobId: string }).jobId);
    if (!job) return reply.code(404).send({ code: "not_found", message: "Job not found" });
    return job;
  });
};
