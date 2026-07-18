import { buildServer } from "../../dist/server.js";

const serverPromise = buildServer().then((app) => app.ready());

export const handler = async (event: any, context: any) => {
  const app = await serverPromise;
  const url = new URL(event.path, "http://localhost");
  const body =
    event.body != null
      ? event.isBase64Encoded
        ? Buffer.from(event.body, "base64")
        : Buffer.from(event.body)
      : undefined;

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
