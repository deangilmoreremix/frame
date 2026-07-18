import { describe, it, expect, beforeAll } from "vitest";
import { buildServer } from "../src/server.ts";

describe("backend API", () => {
  it("health check returns ok", async () => {
    const app = await buildServer();
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("ok");
    await app.close();
  });

  it("creates a project and lists it", async () => {
    const app = await buildServer();
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/projects",
      payload: { name: "Test Cut" },
    });
    expect(created.statusCode).toBe(200);
    const project = created.json();
    const list = await app.inject({ method: "GET", url: "/api/v1/projects" });
    expect(list.json().some((p: { id: string }) => p.id === project.id)).toBe(true);
    await app.close();
  });
});
