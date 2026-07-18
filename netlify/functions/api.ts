import { builder } from "@netlify/functions";
import { buildServer } from "../../packages/frame-backend/src/server.js";

const serverPromise = buildServer().then((app) => app.ready());

const proxy = async (event: any, context: any) => {
  const app = await serverPromise;
  const url = new URL(event.path, "http://localhost");
  const body =
    event.body != null
      ? event.isBase64Encoded
        ? Buffer.from(event.body, "base64")
        : Buffer.from(event.body)
      : undefined;

  const request = new Request(url.toString(), {
    method: event.httpMethod,
    headers: { ...(event.headers ?? {}), host: "localhost" },
    body: event.httpMethod === "GET" || event.httpMethod === "HEAD" ? undefined : body,
  });

  const response = await app.inject({
    method: event.httpMethod,
    url: url.pathname + url.search,
    headers: event.headers ?? {},
    payload: body,
  });

  return {
    statusCode: response.statusCode,
    headers: response.headers,
    body: response.rawPayload.toString("base64"),
    isBase64Encoded: true,
  };
};

export const handler = builder(proxy);
