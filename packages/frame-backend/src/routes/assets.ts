import type { FastifyPluginAsync } from "fastify";
import { v4 as uuid } from "uuid";
import { db } from "../db.js";
import {
  MAX_UPLOAD_BYTES,
  SUPPORTED_AUDIO_MIME,
  SUPPORTED_IMAGE_MIME,
  SUPPORTED_VIDEO_MIME,
  type MediaAsset,
} from "@frame/common";

export const assetsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/projects/:id/assets", async (req) => {
    const projectId = (req.params as { id: string }).id;
    return [...db.assets.values()].filter((a) => a.projectId === projectId);
  });

  app.post("/projects/:id/assets", async (req, reply) => {
    const projectId = (req.params as { id: string }).id;
    if (!db.projects.has(projectId)) {
      return reply.code(404).send({ code: "not_found", message: "Project not found" });
    }
    const data = await req.file();
    if (!data) return reply.code(400).send({ code: "no_file", message: "No file uploaded" });
    if (data.file.bytesRead > MAX_UPLOAD_BYTES) {
      return reply.code(413).send({ code: "too_large", message: "File exceeds size limit" });
    }
    const allowed = [
      ...SUPPORTED_VIDEO_MIME,
      ...SUPPORTED_AUDIO_MIME,
      ...SUPPORTED_IMAGE_MIME,
    ] as readonly string[];
    if (!allowed.includes(data.mimetype)) {
      return reply.code(415).send({ code: "bad_type", message: "Unsupported media type" });
    }

    const kind = SUPPORTED_VIDEO_MIME.includes(data.mimetype as never)
      ? "video"
      : SUPPORTED_AUDIO_MIME.includes(data.mimetype as never)
        ? "audio"
        : "image";

    const asset: MediaAsset = {
      id: uuid(),
      projectId,
      kind,
      fileName: data.filename,
      mimeType: data.mimetype,
      sizeBytes: data.file.bytesRead,
      durationSeconds: 0,
      width: 0,
      height: 0,
      storageKey: `assets/${projectId}/${uuid()}-${data.filename}`,
      createdAt: new Date().toISOString(),
    };
    db.assets.set(asset.id, asset);
    // NOTE: stream (data.file) is persisted to object storage in production.
    return reply.code(201).send(asset);
  });
};
