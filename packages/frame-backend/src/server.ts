import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { projectsRoutes } from "./routes/projects.js";
import { assetsRoutes } from "./routes/assets.js";
import { timelineRoutes } from "./routes/timeline.js";
import { renderRoutes } from "./routes/render.js";
import { agentRoutes } from "./routes/agent.js";

export async function buildServer() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: process.env.CORS_ORIGIN ?? true });
  await app.register(multipart, { limits: { fileSize: 2 * 1024 * 1024 * 1024 } });

  app.get("/health", async () => ({ status: "ok", ts: Date.now() }));

  await app.register(projectsRoutes, { prefix: "/api/v1" });
  await app.register(assetsRoutes, { prefix: "/api/v1" });
  await app.register(timelineRoutes, { prefix: "/api/v1" });
  await app.register(renderRoutes, { prefix: "/api/v1" });
  await app.register(agentRoutes, { prefix: "/api/v1" });

  return app;
}

const port = Number(process.env.PORT ?? 4000);
// Auto-start the HTTP server only when run as a standalone process (local dev / container).
// In a serverless context (Netlify Function) the listener must NOT start; the function
// imports buildServer() and serves via app.inject instead.
const isServerless = process.env.NETLIFY === "true" || process.env.AWS_LAMBDA_FUNCTION_NAME != null;
if (process.env.NODE_ENV !== "test" && !isServerless) {
  buildServer()
    .then((app) => app.listen({ port, host: "0.0.0.0" }))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
