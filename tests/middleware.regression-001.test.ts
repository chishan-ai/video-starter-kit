// Regression: ISSUE-001 — API routes returned 307 redirect instead of 401 JSON
// Found by /qa on 2026-03-27
// Report: .gstack/qa-reports/qa-report-localhost-2026-03-27.md

import { describe, expect, it } from "vitest";

describe("Middleware auth behavior", () => {
  it("should return 401 JSON for unauthenticated API requests", async () => {
    const res = await fetch("http://localhost:3000/api/projects");
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("should redirect unauthenticated page requests to login", async () => {
    const res = await fetch("http://localhost:3000/dashboard", {
      redirect: "manual",
    });
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("should allow access to public routes without auth", async () => {
    const res = await fetch("http://localhost:3000/login");
    expect(res.status).toBe(200);
  });
});
