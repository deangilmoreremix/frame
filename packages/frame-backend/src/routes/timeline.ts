import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { db, getTimeline } from "../db.js";
import {
  DEFAULT_TRANSITION_DURATION,
  type Clip,
  type ClipTransition,
  type Track,
} from "@frame/common";

const clipBody = z.object({
  trackId: z.string().uuid(),
  assetId: z.string().uuid(),
  startSeconds: z.number().min(0),
  endSeconds: z.number().min(0),
  inPointSeconds: z.number().min(0),
  outPointSeconds: z.number().min(0),
  transition: z.enum(["none", "fade", "dissolve", "slide"]).default("none"),
  transitionDurationSeconds: z.number().min(0).default(DEFAULT_TRANSITION_DURATION),
});

export const timelineRoutes: FastifyPluginAsync = async (app) => {
  app.get("/projects/:id/timeline", async (req) => {
    const projectId = (req.params as { id: string }).id;
    return getTimeline(projectId);
  });

  app.post("/projects/:id/tracks", async (req) => {
    const projectId = (req.params as { id: string }).id;
    const body = z.object({ kind: z.enum(["video", "audio"]), name: z.string() }).parse(req.body);
    const index = [...db.tracks.values()].filter((t) => t.projectId === projectId).length;
    const track: Track = { id: uuid(), projectId, kind: body.kind, name: body.name, index };
    db.tracks.set(track.id, track);
    return track;
  });

  app.post("/projects/:id/clips", async (req, reply) => {
    const projectId = (req.params as { id: string }).id;
    const body = clipBody.parse(req.body);
    if (!db.tracks.has(body.trackId) || !db.assets.has(body.assetId)) {
      return reply.code(404).send({ code: "not_found", message: "Track or asset missing" });
    }
    const clip: Clip = { id: uuid(), ...body, transition: body.transition as ClipTransition };
    db.clips.set(clip.id, clip);
    return reply.code(201).send(clip);
  });

  app.delete<{ Params: { id: string; clipId: string } }>(
    "/projects/:id/clips/:clipId",
    async (req, reply) => {
      const ok = db.clips.delete(req.params.clipId);
      if (!ok) return reply.code(404).send({ code: "not_found", message: "Clip not found" });
      return reply.code(204).send();
    },
  );
};
